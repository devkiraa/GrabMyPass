'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Server,
    Database,
    Clock,
    Cpu,
    HardDrive,
    Activity,
    RefreshCw,
    Wifi,
    WifiOff,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Zap,
    Globe,
    Mail,
    CreditCard,
    Wallet,
    Users,
    Calendar,
    Ticket,
    Timer,
    Cloud,
    ExternalLink
} from 'lucide-react';

interface ServerStatus {
    server: {
        status: string;
        environment: string;
        nodeVersion: string;
        platform: string;
        arch: string;
        pid: number;
    };
    uptime: {
        raw: number;
        seconds: number;
        formatted: string;
        startedAt: string;
    };
    memory: {
        heapUsed: string;
        heapTotal: string;
        rss: string;
        external: string;
        heapUsedPercent: string;
    };
    database: {
        status: string;
        connected: boolean;
        collections: {
            users: number;
            events: number;
            tickets: number;
        };
    };
    redis: {
        status: string;
        host: string;
    };
    keepAlive: {
        enabled: boolean;
        lastPing: string | null;
        pingCount: number;
        lastPingSuccess: boolean;
        intervalMinutes: number;
        nextPingIn: number | null;
    };
    services: {
        razorpay: boolean;
        zeptomail: boolean;
        googleWallet: boolean;
        googleAuth: boolean;
    };
    hosting?: {
        backend: {
            platform: string;
            url: string;
            region: string;
            instance: string;
            serviceType: string;
        };
        frontend: {
            platform: string;
            url: string;
        };
        database: {
            provider: string;
            cluster: string;
        };
        cache: {
            provider: string;
            region: string;
        };
    };
    timestamp: string;
}

export default function AdminStatusPage() {
    const router = useRouter();
    const [status, setStatus] = useState<ServerStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const fetchStatus = useCallback(async (showRefreshing = true) => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            router.push('/login');
            return;
        }

        if (showRefreshing) setRefreshing(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/server-status`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to fetch server status');
            const data = await res.json();
            setStatus(data);
            setLastRefresh(new Date());
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to load server status');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [router]);

    useEffect(() => {
        fetchStatus(false);
    }, [fetchStatus]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!autoRefresh) return;
        
        const interval = setInterval(() => {
            fetchStatus(false);
        }, 30000);

        return () => clearInterval(interval);
    }, [autoRefresh, fetchStatus]);

    const formatTimeAgo = (dateString: string | null) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const formatNextPing = (ms: number | null) => {
        if (!ms) return 'N/A';
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <Server className="h-12 w-12 text-indigo-400 mb-4 animate-bounce" />
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (error && !status) {
        return (
            <div className="p-6">
                <Card className="border-red-200">
                    <CardContent className="p-6 text-center">
                        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600">{error}</p>
                        <Button onClick={() => fetchStatus()} className="mt-4">
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Server Status</h1>
                    <p className="text-slate-500">Monitor API health and keep-alive status</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock className="h-4 w-4" />
                        {lastRefresh ? `Updated ${formatTimeAgo(lastRefresh.toISOString())}` : 'Loading...'}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={autoRefresh ? 'border-green-300 text-green-700' : ''}
                    >
                        {autoRefresh ? <Wifi className="h-4 w-4 mr-2" /> : <WifiOff className="h-4 w-4 mr-2" />}
                        {autoRefresh ? 'Auto' : 'Manual'}
                    </Button>
                    <Button onClick={() => fetchStatus()} disabled={refreshing}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {status && (
                <>
                    {/* Server Status Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className={`border-l-4 ${status.server.status === 'online' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500">Server Status</p>
                                        <p className="text-2xl font-bold capitalize">{status.server.status}</p>
                                    </div>
                                    <div className={`p-3 rounded-full ${status.server.status === 'online' ? 'bg-green-100' : 'bg-red-100'}`}>
                                        {status.server.status === 'online' ? (
                                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                                        ) : (
                                            <XCircle className="h-6 w-6 text-red-600" />
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={`border-l-4 ${status.database.connected ? 'border-l-green-500' : 'border-l-red-500'}`}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500">Database</p>
                                        <p className="text-2xl font-bold capitalize">{status.database.status}</p>
                                    </div>
                                    <div className={`p-3 rounded-full ${status.database.connected ? 'bg-green-100' : 'bg-red-100'}`}>
                                        <Database className={`h-6 w-6 ${status.database.connected ? 'text-green-600' : 'text-red-600'}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-indigo-500">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500">Uptime</p>
                                        <p className="text-2xl font-bold">{status.uptime.formatted}</p>
                                    </div>
                                    <div className="p-3 rounded-full bg-indigo-100">
                                        <Clock className="h-6 w-6 text-indigo-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-purple-500">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500">Memory Usage</p>
                                        <p className="text-2xl font-bold">{status.memory.heapUsedPercent}%</p>
                                    </div>
                                    <div className="p-3 rounded-full bg-purple-100">
                                        <Cpu className="h-6 w-6 text-purple-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Keep-Alive Status */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-indigo-600" />
                                        Keep-Alive System
                                    </CardTitle>
                                    <CardDescription>
                                        Prevents Render free tier from spinning down after inactivity
                                    </CardDescription>
                                </div>
                                <Badge variant={status.keepAlive.enabled ? 'default' : 'secondary'} className={status.keepAlive.enabled ? 'bg-green-100 text-green-800' : ''}>
                                    {status.keepAlive.enabled ? 'Active' : 'Disabled (Development)'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Timer className="h-4 w-4" />
                                        Ping Interval
                                    </div>
                                    <p className="text-xl font-semibold">{status.keepAlive.intervalMinutes} minutes</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Zap className="h-4 w-4" />
                                        Total Pings
                                    </div>
                                    <p className="text-xl font-semibold">{status.keepAlive.pingCount}</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Clock className="h-4 w-4" />
                                        Last Ping
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xl font-semibold">{formatTimeAgo(status.keepAlive.lastPing)}</p>
                                        {status.keepAlive.lastPing && (
                                            status.keepAlive.lastPingSuccess ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-500" />
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <RefreshCw className="h-4 w-4" />
                                        Next Ping In
                                    </div>
                                    <p className="text-xl font-semibold">
                                        {status.keepAlive.enabled ? formatNextPing(status.keepAlive.nextPingIn) : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {!status.keepAlive.enabled && (
                                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-amber-800">Keep-Alive Disabled</p>
                                            <p className="text-sm text-amber-700">
                                                Keep-alive is disabled in development mode. It will automatically enable when <code className="bg-amber-100 px-1 rounded">NODE_ENV=production</code>.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Hosting Infrastructure */}
                    {status.hosting && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Cloud className="h-5 w-5 text-sky-600" />
                                    Hosting Infrastructure
                                </CardTitle>
                                <CardDescription>
                                    Deployment platforms and cloud services powering MakeTicket
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Frontend - Vercel */}
                                    <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl text-white">
                                        <div className="flex items-center gap-2 mb-3">
                                            <svg className="h-5 w-5" viewBox="0 0 76 65" fill="currentColor">
                                                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                                            </svg>
                                            <span className="font-semibold">Vercel</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mb-1">Frontend Platform</p>
                                        <p className="text-sm font-medium truncate">{status.hosting.frontend.url}</p>
                                        <div className="mt-3 flex items-center gap-1 text-xs text-emerald-400">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Edge Network
                                        </div>
                                    </div>

                                    {/* Backend - Render */}
                                    <div className="p-4 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl text-white">
                                        <div className="flex items-center gap-2 mb-3">
                                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                            </svg>
                                            <span className="font-semibold">{status.hosting.backend.platform}</span>
                                        </div>
                                        <p className="text-xs text-emerald-200 mb-1">Backend API</p>
                                        <p className="text-sm font-medium truncate">{status.hosting.backend.url}</p>
                                        <div className="mt-3 flex items-center gap-1 text-xs text-emerald-200">
                                            <Server className="h-3 w-3" />
                                            {status.hosting.backend.serviceType}
                                        </div>
                                    </div>

                                    {/* Database - MongoDB Atlas */}
                                    <div className="p-4 bg-gradient-to-br from-green-600 to-green-700 rounded-xl text-white">
                                        <div className="flex items-center gap-2 mb-3">
                                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                                                <path d="M11 7h2v6h-2zm0 8h2v2h-2z"/>
                                            </svg>
                                            <span className="font-semibold">MongoDB</span>
                                        </div>
                                        <p className="text-xs text-green-200 mb-1">{status.hosting.database.provider}</p>
                                        <p className="text-sm font-medium">{status.hosting.database.cluster}</p>
                                        <div className="mt-3 flex items-center gap-1 text-xs text-green-200">
                                            <Database className="h-3 w-3" />
                                            Cloud Database
                                        </div>
                                    </div>

                                    {/* Cache - Upstash Redis */}
                                    <div className="p-4 bg-gradient-to-br from-red-600 to-rose-700 rounded-xl text-white">
                                        <div className="flex items-center gap-2 mb-3">
                                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-2H3v2z"/>
                                            </svg>
                                            <span className="font-semibold">{status.hosting.cache.provider}</span>
                                        </div>
                                        <p className="text-xs text-red-200 mb-1">Cache Layer</p>
                                        <p className="text-sm font-medium">{status.hosting.cache.region}</p>
                                        <div className="mt-3 flex items-center gap-1 text-xs text-red-200">
                                            <Zap className="h-3 w-3" />
                                            Low Latency
                                        </div>
                                    </div>
                                </div>

                                {/* URLs Section */}
                                <div className="mt-6 pt-6 border-t">
                                    <h4 className="text-sm font-medium text-slate-700 mb-3">Service Endpoints</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Globe className="h-4 w-4 text-slate-500" />
                                                <span className="text-sm text-slate-600">Frontend URL</span>
                                            </div>
                                            <a 
                                                href={status.hosting.frontend.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
                                            >
                                                {status.hosting.frontend.url.replace(/^https?:\/\//, '')}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Server className="h-4 w-4 text-slate-500" />
                                                <span className="text-sm text-slate-600">Backend API</span>
                                            </div>
                                            <a 
                                                href={status.hosting.backend.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
                                            >
                                                {status.hosting.backend.url.replace(/^https?:\/\//, '')}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Server Details & Memory */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Server className="h-5 w-5 text-slate-600" />
                                    Server Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-slate-500">Environment</span>
                                        <Badge variant={status.server.environment === 'production' ? 'default' : 'secondary'}>
                                            {status.server.environment}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-slate-500">Node.js Version</span>
                                        <span className="font-mono">{status.server.nodeVersion}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-slate-500">Platform</span>
                                        <span className="font-mono">{status.server.platform} ({status.server.arch})</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-slate-500">Process ID</span>
                                        <span className="font-mono">{status.server.pid}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-slate-500">Started At</span>
                                        <span>{new Date(status.uptime.startedAt).toLocaleString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <HardDrive className="h-5 w-5 text-slate-600" />
                                    Memory Usage
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-slate-500">Heap Used / Total</span>
                                            <span>{status.memory.heapUsed} / {status.memory.heapTotal}</span>
                                        </div>
                                        <Progress value={parseFloat(status.memory.heapUsedPercent)} className="h-2" />
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-slate-500">Resident Set Size (RSS)</span>
                                        <span className="font-mono">{status.memory.rss}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-slate-500">External Memory</span>
                                        <span className="font-mono">{status.memory.external}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Database & Services */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="h-5 w-5 text-slate-600" />
                                    Database Collections
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                                        <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                                        <p className="text-2xl font-bold">{status.database.collections.users}</p>
                                        <p className="text-sm text-slate-500">Users</p>
                                    </div>
                                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                                        <Calendar className="h-6 w-6 text-green-600 mx-auto mb-2" />
                                        <p className="text-2xl font-bold">{status.database.collections.events}</p>
                                        <p className="text-sm text-slate-500">Events</p>
                                    </div>
                                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                                        <Ticket className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                                        <p className="text-2xl font-bold">{status.database.collections.tickets}</p>
                                        <p className="text-sm text-slate-500">Tickets</p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Redis Cache</span>
                                        <Badge variant={status.redis.status === 'configured' ? 'default' : 'secondary'}>
                                            {status.redis.status}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-slate-600" />
                                    Integrated Services
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <CreditCard className="h-5 w-5 text-blue-600" />
                                            <span>Razorpay Payments</span>
                                        </div>
                                        {status.services.razorpay ? (
                                            <Badge className="bg-green-100 text-green-800">Configured</Badge>
                                        ) : (
                                            <Badge variant="secondary">Not Set</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-5 w-5 text-purple-600" />
                                            <span>ZeptoMail</span>
                                        </div>
                                        {status.services.zeptomail ? (
                                            <Badge className="bg-green-100 text-green-800">Configured</Badge>
                                        ) : (
                                            <Badge variant="secondary">Not Set</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Wallet className="h-5 w-5 text-amber-600" />
                                            <span>Google Wallet</span>
                                        </div>
                                        {status.services.googleWallet ? (
                                            <Badge className="bg-green-100 text-green-800">Configured</Badge>
                                        ) : (
                                            <Badge variant="secondary">Not Set</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Users className="h-5 w-5 text-red-600" />
                                            <span>Google Auth</span>
                                        </div>
                                        {status.services.googleAuth ? (
                                            <Badge className="bg-green-100 text-green-800">Configured</Badge>
                                        ) : (
                                            <Badge variant="secondary">Not Set</Badge>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
