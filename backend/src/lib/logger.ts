/**
 * Production-Grade Structured Logger
 * 
 * JSON-based logging with standardized fields for observability.
 * Supports trace propagation, sensitive data redaction, and environment-aware output.
 */

import { AsyncLocalStorage } from 'async_hooks';
import crypto from 'crypto';

// ============================================================================
// Types & Interfaces
// ============================================================================

export enum LogLevel {
    TRACE = 0,
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4,
    FATAL = 5
}

export interface LogContext {
    request_id?: string;
    trace_id?: string;
    span_id?: string;
    user_id?: string;
    session_id?: string;
    [key: string]: unknown;
}

export interface LogEntry {
    timestamp: string;
    level: keyof typeof LogLevel;
    service: string;
    environment: string;
    event: string;
    message?: string;
    request_id?: string;
    trace_id?: string;
    span_id?: string;
    user_id?: string;
    duration_ms?: number;
    error?: {
        name: string;
        message: string;
        stack?: string;
        code?: string;
    };
    http?: {
        method?: string;
        path?: string;
        status_code?: number;
        response_time_ms?: number;
        client_ip?: string;
        user_agent?: string;
    };
    data?: Record<string, unknown>;
}

// ============================================================================
// Configuration
// ============================================================================

const SERVICE_NAME = 'maketicket-api';
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = ENVIRONMENT === 'production';

// Log level threshold based on environment
const LOG_LEVEL_THRESHOLD: LogLevel = IS_PRODUCTION ? LogLevel.INFO : LogLevel.DEBUG;

// Fields to redact from logs
const SENSITIVE_FIELDS = new Set([
    'password', 'token', 'secret', 'key', 'authorization', 'cookie',
    'credit_card', 'creditcard', 'cvv', 'ssn', 'api_key', 'apikey',
    'private_key', 'privatekey', 'access_token', 'accesstoken',
    'refresh_token', 'refreshtoken', 'jwt', 'bearer', 'auth',
    'credentials', 'pin', 'otp', 'verification_code'
]);

const SENSITIVE_PATTERNS = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email (partial redaction)
    /\b\d{10,16}\b/g, // Phone/Card numbers
];

// ============================================================================
// Async Context Storage (for request tracing)
// ============================================================================

export const asyncContext = new AsyncLocalStorage<LogContext>();

export function getContext(): LogContext {
    return asyncContext.getStore() || {};
}

export function setContext(ctx: LogContext): void {
    const store = asyncContext.getStore();
    if (store) {
        Object.assign(store, ctx);
    }
}

export function generateRequestId(): string {
    return `req_${crypto.randomBytes(12).toString('hex')}`;
}

export function generateTraceId(): string {
    return crypto.randomBytes(16).toString('hex');
}

export function generateSpanId(): string {
    return crypto.randomBytes(8).toString('hex');
}

// ============================================================================
// Redaction Utilities
// ============================================================================

function redactValue(value: unknown, key: string): unknown {
    if (value === null || value === undefined) return value;
    
    const lowerKey = key.toLowerCase();
    
    // Check if key is sensitive
    if (SENSITIVE_FIELDS.has(lowerKey) || 
        Array.from(SENSITIVE_FIELDS).some(f => lowerKey.includes(f))) {
        if (typeof value === 'string' && value.length > 0) {
            return '[REDACTED]';
        }
        return '[REDACTED]';
    }
    
    return value;
}

function redactObject(obj: unknown, depth = 0): unknown {
    if (depth > 10) return '[MAX_DEPTH]';
    
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
        // Partial email redaction (keep domain)
        let result = obj;
        const emailMatch = result.match(/([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/);
        if (emailMatch) {
            result = result.replace(emailMatch[1], '***');
        }
        return result;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => redactObject(item, depth + 1));
    }
    
    if (typeof obj === 'object') {
        const redacted: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            const redactedValue = redactValue(value, key);
            if (redactedValue === '[REDACTED]') {
                redacted[key] = redactedValue;
            } else if (typeof value === 'object' && value !== null) {
                redacted[key] = redactObject(value, depth + 1);
            } else {
                redacted[key] = redactedValue;
            }
        }
        return redacted;
    }
    
    return obj;
}

// ============================================================================
// Core Logger Class
// ============================================================================

class Logger {
    private levelToString(level: LogLevel): keyof typeof LogLevel {
        return LogLevel[level] as keyof typeof LogLevel;
    }

    private shouldLog(level: LogLevel): boolean {
        return level >= LOG_LEVEL_THRESHOLD;
    }

    private formatEntry(
        level: LogLevel,
        event: string,
        data?: Record<string, unknown>,
        error?: Error
    ): LogEntry {
        const ctx = getContext();
        
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level: this.levelToString(level),
            service: SERVICE_NAME,
            environment: ENVIRONMENT,
            event,
            request_id: ctx.request_id,
            trace_id: ctx.trace_id,
            span_id: ctx.span_id,
            user_id: ctx.user_id ? String(ctx.user_id) : undefined,
        };

        if (data) {
            entry.data = redactObject(data) as Record<string, unknown>;
        }

        if (error) {
            entry.error = {
                name: error.name,
                message: error.message,
                stack: IS_PRODUCTION ? undefined : error.stack,
                code: (error as NodeJS.ErrnoException).code,
            };
        }

        // Remove undefined fields
        return JSON.parse(JSON.stringify(entry));
    }

    private output(entry: LogEntry): void {
        const json = JSON.stringify(entry);
        
        if (entry.level === 'ERROR' || entry.level === 'FATAL') {
            process.stderr.write(json + '\n');
        } else {
            process.stdout.write(json + '\n');
        }
    }

    // Development-friendly console output
    private devOutput(entry: LogEntry): void {
        const time = new Date(entry.timestamp).toLocaleTimeString();
        const levelColors: Record<string, string> = {
            TRACE: '\x1b[90m',   // Gray
            DEBUG: '\x1b[36m',   // Cyan
            INFO: '\x1b[32m',    // Green
            WARN: '\x1b[33m',    // Yellow
            ERROR: '\x1b[31m',   // Red
            FATAL: '\x1b[35m',   // Magenta
        };
        const reset = '\x1b[0m';
        const color = levelColors[entry.level] || reset;
        
        let msg = `${color}[${time}] ${entry.level.padEnd(5)}${reset} ${entry.event}`;
        
        if (entry.request_id) {
            msg += ` ${'\x1b[90m'}rid=${entry.request_id.slice(0, 12)}${reset}`;
        }
        
        if (entry.http) {
            msg += ` ${entry.http.method} ${entry.http.path} ${entry.http.status_code} ${entry.http.response_time_ms}ms`;
        }
        
        if (entry.duration_ms !== undefined) {
            msg += ` ${'\x1b[90m'}${entry.duration_ms}ms${reset}`;
        }
        
        if (entry.error) {
            msg += `\n  ${'\x1b[31m'}${entry.error.name}: ${entry.error.message}${reset}`;
            if (entry.error.stack) {
                msg += `\n${entry.error.stack.split('\n').slice(1, 4).join('\n')}`;
            }
        }
        
        if (entry.data && Object.keys(entry.data).length > 0) {
            const dataStr = JSON.stringify(entry.data);
            if (dataStr.length < 200) {
                msg += ` ${'\x1b[90m'}${dataStr}${reset}`;
            }
        }
        
        console.log(msg);
    }

    private log(level: LogLevel, event: string, data?: Record<string, unknown>, error?: Error): void {
        if (!this.shouldLog(level)) return;
        
        const entry = this.formatEntry(level, event, data, error);
        
        if (IS_PRODUCTION) {
            this.output(entry);
        } else {
            this.devOutput(entry);
        }
    }

    trace(event: string, data?: Record<string, unknown>): void {
        this.log(LogLevel.TRACE, event, data);
    }

    debug(event: string, data?: Record<string, unknown>): void {
        this.log(LogLevel.DEBUG, event, data);
    }

    info(event: string, data?: Record<string, unknown>): void {
        this.log(LogLevel.INFO, event, data);
    }

    warn(event: string, data?: Record<string, unknown>, error?: Error): void {
        this.log(LogLevel.WARN, event, data, error);
    }

    error(event: string, dataOrError?: Record<string, unknown> | Error | unknown, maybeError?: Error | unknown): void {
        let data: Record<string, unknown> | undefined;
        let err: Error | undefined;
        
        // Handle different call signatures
        if (dataOrError instanceof Error) {
            err = dataOrError;
        } else if (maybeError instanceof Error) {
            err = maybeError;
            data = dataOrError as Record<string, unknown>;
        } else if (dataOrError && typeof dataOrError === 'object' && !Array.isArray(dataOrError)) {
            data = dataOrError as Record<string, unknown>;
            if (maybeError) {
                err = maybeError instanceof Error ? maybeError : new Error(String(maybeError));
            }
        }
        
        this.log(LogLevel.ERROR, event, data, err);
    }

    fatal(event: string, dataOrError?: Record<string, unknown> | Error | unknown, maybeError?: Error | unknown): void {
        let data: Record<string, unknown> | undefined;
        let err: Error | undefined;
        
        // Handle different call signatures
        if (dataOrError instanceof Error) {
            err = dataOrError;
        } else if (maybeError instanceof Error) {
            err = maybeError;
            data = dataOrError as Record<string, unknown>;
        } else if (dataOrError && typeof dataOrError === 'object' && !Array.isArray(dataOrError)) {
            data = dataOrError as Record<string, unknown>;
            if (maybeError) {
                err = maybeError instanceof Error ? maybeError : new Error(String(maybeError));
            }
        }
        
        this.log(LogLevel.FATAL, event, data, err);
    }

    // HTTP request logging helpers
    httpRequest(data: {
        method: string;
        path: string;
        client_ip?: string;
        user_agent?: string;
    }): void {
        this.info('http.request.received', { http: data });
    }

    httpResponse(data: {
        method: string;
        path: string;
        status_code: number;
        response_time_ms: number;
        client_ip?: string;
    }): void {
        const level = data.status_code >= 500 ? LogLevel.ERROR :
                      data.status_code >= 400 ? LogLevel.WARN : LogLevel.INFO;
        this.log(level, 'http.response.sent', { http: data });
    }

    // Security event logging
    security(event: string, data?: Record<string, unknown>): void {
        this.warn(`security.${event}`, data);
    }

    // Database operation logging
    db(event: string, data?: Record<string, unknown>): void {
        this.debug(`db.${event}`, data);
    }

    // External API call logging
    external(event: string, data?: Record<string, unknown>): void {
        this.info(`external.${event}`, data);
    }

    // Create child logger with additional context
    child(additionalContext: Record<string, unknown>): ChildLogger {
        return new ChildLogger(this, additionalContext);
    }
}

class ChildLogger {
    constructor(
        private parent: Logger,
        private additionalContext: Record<string, unknown>
    ) {}

    private merge(data?: Record<string, unknown>): Record<string, unknown> {
        return { ...this.additionalContext, ...data };
    }

    trace(event: string, data?: Record<string, unknown>): void {
        (this.parent as Logger).trace(event, this.merge(data));
    }

    debug(event: string, data?: Record<string, unknown>): void {
        (this.parent as Logger).debug(event, this.merge(data));
    }

    info(event: string, data?: Record<string, unknown>): void {
        (this.parent as Logger).info(event, this.merge(data));
    }

    warn(event: string, data?: Record<string, unknown>, error?: Error): void {
        (this.parent as Logger).warn(event, this.merge(data), error);
    }

    error(event: string, error?: Error | unknown, data?: Record<string, unknown>): void {
        (this.parent as Logger).error(event, error, this.merge(data));
    }

    fatal(event: string, error?: Error | unknown, data?: Record<string, unknown>): void {
        (this.parent as Logger).fatal(event, error, this.merge(data));
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const logger = new Logger();

// Default export for convenience
export default logger;
