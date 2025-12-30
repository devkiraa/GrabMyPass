/**
 * Production-Grade Client-Side Logger
 * 
 * Structured logging for frontend with batching, performance tracking,
 * and async transmission to backend.
 */

// ============================================================================
// Types
// ============================================================================

export enum LogLevel {
    TRACE = 0,
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4,
    FATAL = 5
}

interface ClientLogEntry {
    timestamp: string;
    level: keyof typeof LogLevel;
    service: string;
    environment: string;
    event: string;
    session_id?: string;
    user_id?: string;
    trace_id?: string;
    page_url?: string;
    referrer?: string;
    browser?: string;
    os?: string;
    app_version?: string;
    data?: Record<string, unknown>;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
    performance?: {
        page_load_time?: number;
        dom_ready_time?: number;
        memory_usage?: number;
    };
}

interface LoggerConfig {
    service: string;
    environment: string;
    endpoint?: string;
    batchSize: number;
    flushInterval: number;
    maxQueueSize: number;
    enableConsole: boolean;
    logLevel: LogLevel;
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG: LoggerConfig = {
    service: 'maketicket-web',
    environment: process.env.NODE_ENV || 'development',
    endpoint: '/api/logs/client',
    batchSize: 10,
    flushInterval: 30000, // 30 seconds
    maxQueueSize: 100,
    enableConsole: process.env.NODE_ENV !== 'production',
    logLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
};

// Sensitive patterns to redact
const SENSITIVE_PATTERNS = [
    /password[=:]\s*["']?[^"'\s&]+/gi,
    /token[=:]\s*["']?[^"'\s&]+/gi,
    /bearer\s+[a-zA-Z0-9._-]+/gi,
    /authorization[=:]\s*["']?[^"'\s&]+/gi,
];

// ============================================================================
// Utilities
// ============================================================================

function generateId(prefix: string = ''): string {
    const random = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now().toString(36);
    return `${prefix}${timestamp}${random}`;
}

function getSessionId(): string {
    if (typeof window === 'undefined') return '';
    
    let sessionId = sessionStorage.getItem('__log_session_id');
    if (!sessionId) {
        sessionId = generateId('sess_');
        sessionStorage.setItem('__log_session_id', sessionId);
    }
    return sessionId;
}

function getBrowserInfo(): { browser: string; os: string } {
    if (typeof window === 'undefined') {
        return { browser: 'unknown', os: 'unknown' };
    }
    
    const ua = navigator.userAgent;
    let browser = 'unknown';
    let os = 'unknown';
    
    // Detect browser
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Opera')) browser = 'Opera';
    
    // Detect OS
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    
    return { browser, os };
}

function hashUserId(userId: string): string {
    // Simple hash for anonymization (not cryptographic)
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        const char = userId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `u_${Math.abs(hash).toString(36)}`;
}

function redactSensitiveData(data: unknown): unknown {
    if (typeof data === 'string') {
        let result = data;
        for (const pattern of SENSITIVE_PATTERNS) {
            result = result.replace(pattern, '[REDACTED]');
        }
        return result;
    }
    
    if (Array.isArray(data)) {
        return data.map(redactSensitiveData);
    }
    
    if (data && typeof data === 'object') {
        const redacted: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data)) {
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes('password') || lowerKey.includes('token') ||
                lowerKey.includes('secret') || lowerKey.includes('key') ||
                lowerKey.includes('auth')) {
                redacted[key] = '[REDACTED]';
            } else {
                redacted[key] = redactSensitiveData(value);
            }
        }
        return redacted;
    }
    
    return data;
}

// ============================================================================
// Client Logger Class
// ============================================================================

class ClientLogger {
    private config: LoggerConfig;
    private queue: ClientLogEntry[] = [];
    private flushTimer: ReturnType<typeof setInterval> | null = null;
    private sessionId: string = '';
    private userId: string = '';
    private browserInfo: { browser: string; os: string } = { browser: 'unknown', os: 'unknown' };
    private initialized: boolean = false;

    constructor(config: Partial<LoggerConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    init(): void {
        if (this.initialized || typeof window === 'undefined') return;
        
        this.sessionId = getSessionId();
        this.browserInfo = getBrowserInfo();
        this.initialized = true;
        
        // Setup flush timer
        this.flushTimer = setInterval(() => this.flush(), this.config.flushInterval);
        
        // Flush on page unload
        window.addEventListener('beforeunload', () => this.flush(true));
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.flush(true);
            }
        });
        
        // Capture unhandled errors
        window.addEventListener('error', (event) => {
            this.error('unhandled.error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
            });
        });
        
        // Capture unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.error('unhandled.promise_rejection', {
                reason: String(event.reason),
            });
        });
        
        // Log page load performance
        if (window.performance) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
                    if (perf) {
                        this.info('page.loaded', {
                            page_load_time: Math.round(perf.loadEventEnd - perf.fetchStart),
                            dom_ready_time: Math.round(perf.domContentLoadedEventEnd - perf.fetchStart),
                            dns_time: Math.round(perf.domainLookupEnd - perf.domainLookupStart),
                            connect_time: Math.round(perf.connectEnd - perf.connectStart),
                            ttfb: Math.round(perf.responseStart - perf.requestStart),
                        });
                    }
                }, 0);
            });
        }
        
        this.info('session.started', {
            session_id: this.sessionId,
            ...this.browserInfo,
        });
    }

    setUserId(userId: string): void {
        this.userId = hashUserId(userId);
    }

    clearUserId(): void {
        this.userId = '';
    }

    private shouldLog(level: LogLevel): boolean {
        return level >= this.config.logLevel;
    }

    private createEntry(
        level: LogLevel,
        event: string,
        data?: Record<string, unknown>,
        error?: Error
    ): ClientLogEntry {
        const entry: ClientLogEntry = {
            timestamp: new Date().toISOString(),
            level: LogLevel[level] as keyof typeof LogLevel,
            service: this.config.service,
            environment: this.config.environment,
            event,
            session_id: this.sessionId,
            user_id: this.userId || undefined,
            trace_id: generateId('tr_'),
            page_url: typeof window !== 'undefined' ? window.location.pathname : undefined,
            referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
            browser: this.browserInfo.browser,
            os: this.browserInfo.os,
            app_version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        };

        if (data) {
            entry.data = redactSensitiveData(data) as Record<string, unknown>;
        }

        if (error) {
            entry.error = {
                name: error.name,
                message: error.message,
                stack: this.config.environment !== 'production' ? error.stack : undefined,
            };
        }

        return entry;
    }

    private enqueue(entry: ClientLogEntry): void {
        if (this.queue.length >= this.config.maxQueueSize) {
            this.queue.shift(); // Remove oldest
        }
        this.queue.push(entry);
        
        if (this.queue.length >= this.config.batchSize) {
            this.flush();
        }
    }

    private consoleOutput(entry: ClientLogEntry): void {
        if (!this.config.enableConsole) return;
        
        const style = {
            TRACE: 'color: gray',
            DEBUG: 'color: cyan',
            INFO: 'color: green',
            WARN: 'color: orange',
            ERROR: 'color: red',
            FATAL: 'color: magenta; font-weight: bold',
        };
        
        const args: unknown[] = [
            `%c[${entry.level}]`,
            style[entry.level] || '',
            entry.event,
        ];
        
        if (entry.data) {
            args.push(entry.data);
        }
        
        if (entry.error) {
            args.push(entry.error);
        }
        
        switch (entry.level) {
            case 'ERROR':
            case 'FATAL':
                console.error(...args);
                break;
            case 'WARN':
                console.warn(...args);
                break;
            case 'DEBUG':
            case 'TRACE':
                console.debug(...args);
                break;
            default:
                console.log(...args);
        }
    }

    private async flush(sync: boolean = false): Promise<void> {
        if (this.queue.length === 0) return;
        
        const batch = [...this.queue];
        this.queue = [];
        
        // In production, send to backend
        if (this.config.environment === 'production' && this.config.endpoint) {
            try {
                if (sync && navigator.sendBeacon) {
                    navigator.sendBeacon(
                        this.config.endpoint,
                        JSON.stringify({ logs: batch })
                    );
                } else {
                    fetch(this.config.endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ logs: batch }),
                        keepalive: true,
                    }).catch(() => {
                        // Silently fail - don't log errors about logging
                    });
                }
            } catch {
                // Silently fail
            }
        }
    }

    private log(level: LogLevel, event: string, data?: Record<string, unknown>, error?: Error): void {
        if (!this.shouldLog(level)) return;
        
        const entry = this.createEntry(level, event, data, error);
        
        this.consoleOutput(entry);
        this.enqueue(entry);
    }

    // Public logging methods
    trace(event: string, data?: Record<string, unknown>): void {
        this.log(LogLevel.TRACE, event, data);
    }

    debug(event: string, data?: Record<string, unknown>): void {
        this.log(LogLevel.DEBUG, event, data);
    }

    info(event: string, data?: Record<string, unknown>): void {
        this.log(LogLevel.INFO, event, data);
    }

    warn(event: string, data?: Record<string, unknown>): void {
        this.log(LogLevel.WARN, event, data);
    }

    error(event: string, data?: Record<string, unknown>, error?: Error): void {
        const err = error || (data instanceof Error ? data : undefined);
        const d = data instanceof Error ? undefined : data;
        this.log(LogLevel.ERROR, event, d, err);
    }

    fatal(event: string, data?: Record<string, unknown>, error?: Error): void {
        const err = error || (data instanceof Error ? data : undefined);
        const d = data instanceof Error ? undefined : data;
        this.log(LogLevel.FATAL, event, d, err);
    }

    // Specialized logging methods
    userAction(action: string, data?: Record<string, unknown>): void {
        this.info(`user.${action}`, data);
    }

    navigation(from: string, to: string): void {
        this.info('navigation.change', { from, to });
    }

    apiCall(method: string, url: string, status: number, duration: number): void {
        const level = status >= 500 ? LogLevel.ERROR :
                      status >= 400 ? LogLevel.WARN : LogLevel.INFO;
        this.log(level, 'api.response', {
            method,
            url: url.replace(/\?.*$/, ''), // Remove query params
            status,
            duration_ms: duration,
        });
    }

    performance(metric: string, value: number, unit: string = 'ms'): void {
        this.debug('performance.metric', { metric, value, unit });
    }

    // Destroy logger
    destroy(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
        this.flush(true);
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const clientLogger = new ClientLogger();

// Auto-initialize in browser
if (typeof window !== 'undefined') {
    // Delay init to not block rendering
    setTimeout(() => clientLogger.init(), 0);
}

export default clientLogger;
