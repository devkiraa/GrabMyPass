'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Shield, Key, Lock, AlertTriangle, RefreshCw, Loader2, ShieldAlert, Monitor, Globe, Clock, ChevronLeft, ChevronRight, Search, Filter, FileSearch, Siren, Activity, Gavel, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface SecuritySettings {
    enforceStrongPasswords: boolean;
    enable2FA: boolean;
    allowGoogleAuth: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    rateLimitEnabled: boolean;
    rateLimitWindow: number;
    rateLimitMaxRequests: number;
    loginAlertEnabled: boolean;
    suspiciousActivityMonitoring: boolean;
}

interface SecurityEvent {
    _id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: {
        username: string;
        email: string;
    };
    ipAddress: string;
    userAgent: string;
    details: any;
    status: string;
    createdAt: string;
}

export default function AdminSecurity() {
    const [activeTab, setActiveTab] = useState('monitor');

    // Settings State
    const [settings, setSettings] = useState<SecuritySettings>({
        enforceStrongPasswords: true,
        enable2FA: false,
        allowGoogleAuth: true,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        rateLimitEnabled: true,
        rateLimitWindow: 15,
        rateLimitMaxRequests: 100,
        loginAlertEnabled: false,
        suspiciousActivityMonitoring: true,
    });
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Monitor State
    const [events, setEvents] = useState<SecurityEvent[]>([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEvents, setTotalEvents] = useState(0);

    // Forensics State
    const [forensicQuery, setForensicQuery] = useState('');
    const [forensicResults, setForensicResults] = useState<SecurityEvent[]>([]);

    const { toast } = useToast();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    // Fetch Initial Data
    useEffect(() => {
        fetchSettings();
        fetchEvents(1);
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/settings`);
            if (response.ok) {
                const data = await response.json();
                if (data.settings?.securitySettings) {
                    setSettings(data.settings.securitySettings);
                }
            }
        } catch (error) {
            console.error('Failed to fetch security settings:', error);
        } finally {
            setSettingsLoading(false);
        }
    };

    const fetchEvents = useCallback(async (pageNum: number) => {
        setEventsLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_URL}/admin/security/events?page=${pageNum}&limit=20`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEvents(data.events);
                setTotalPages(data.pages);
                setTotalEvents(data.total);
                setPage(data.page);
            }
        } catch (error) {
            console.error('Failed to fetch security events');
        } finally {
            setEventsLoading(false);
        }
    }, [API_URL]);

    // Actions
    const handleToggle = (key: keyof SecuritySettings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/admin/settings`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ securitySettings: settings })
            });

            if (response.ok) {
                toast({ title: "Success", description: "Security settings updated successfully" });
            } else {
                throw new Error('Failed to update settings');
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update security settings", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleForceLogout = async () => {
        if (!confirm('Are you sure you want to force logout all users?')) return;
        setActionLoading('logout');
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/admin/security/force-logout-all`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                toast({ title: "Success", description: `Logged out all users (${data.sessionsCleared} sessions)` });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to force logout", variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const handleRotateApiKeys = async () => {
        if (!confirm('Are you sure? This will invalidate all existing API keys.')) return;
        setActionLoading('rotate');
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/admin/security/rotate-api-keys`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                toast({ title: "Success", description: "API keys rotated successfully" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to rotate keys", variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const runForensicAnalysis = () => {
        if (!forensicQuery) return;
        // Simple client-side search for now. In reality, this would hit a dedicated search endpoint
        const results = events.filter(e =>
            e.ipAddress?.includes(forensicQuery) ||
            e.userId?.email?.includes(forensicQuery) ||
            e.type?.includes(forensicQuery)
        );
        setForensicResults(results);
        toast({ title: "Analysis Complete", description: `Found ${results.length} related events.` });
    };

    const getSeverityBadge = (severity: string) => {
        const styles = {
            critical: 'bg-red-100 text-red-800 border-red-200',
            high: 'bg-orange-100 text-orange-800 border-orange-200',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            low: 'bg-blue-100 text-blue-800 border-blue-200'
        };
        // @ts-ignore
        const style = styles[severity] || styles.low;
        return <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase border ${style}`}>{severity}</span>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Security Operations Center</h1>
                    <p className="text-slate-500">Monitor threats, investigate incidents, and manage policies.</p>
                </div>
            </div>

            <Tabs defaultValue="monitor" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-white border border-slate-200 p-1">
                    <TabsTrigger value="monitor" className="gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                        <ShieldAlert className="h-4 w-4" /> Threat Monitor
                    </TabsTrigger>
                    <TabsTrigger value="incident_response" className="gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                        <Siren className="h-4 w-4" /> Incident Response
                    </TabsTrigger>
                    <TabsTrigger value="forensics" className="gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                        <FileSearch className="h-4 w-4" /> Forensics
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                        <Key className="h-4 w-4" /> Policy & Settings
                    </TabsTrigger>
                </TabsList>

                {/* THREAT MONITOR TAB */}
                <TabsContent value="monitor" className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-l-4 border-l-red-500 shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Critical Threats (Active)</p>
                                        <h3 className="text-2xl font-bold text-slate-900 mt-2">
                                            {events.filter(e => e.severity === 'critical').length}
                                        </h3>
                                    </div>
                                    <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                        <AlertTriangle className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-orange-500 shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Failed Logins (24h)</p>
                                        <h3 className="text-2xl font-bold text-slate-900 mt-2">
                                            {events.filter(e => e.type === 'auth_failure').length}
                                        </h3>
                                    </div>
                                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                        <Lock className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-blue-500 shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Total Events Logged</p>
                                        <h3 className="text-2xl font-bold text-slate-900 mt-2">{totalEvents}</h3>
                                    </div>
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <Activity className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Events Table (Using same table code from before) */}
                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Live Security Feed</CardTitle>
                                    <CardDescription>Real-time stream of security events.</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => fetchEvents(page)}>
                                    <RefreshCw className={`h-4 w-4 mr-2 ${eventsLoading ? 'animate-spin' : ''}`} />
                                    Refresh Feed
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Severity</th>
                                            <th className="px-6 py-3 font-medium">Type</th>
                                            <th className="px-6 py-3 font-medium">User / Entity</th>
                                            <th className="px-6 py-3 font-medium">Details</th>
                                            <th className="px-6 py-3 font-medium text-right">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {eventsLoading && events.length === 0 ? (
                                            [...Array(5)].map((_, i) => (
                                                <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-4"><div className="h-6 bg-slate-100 rounded w-full" /></td></tr>
                                            ))
                                        ) : events.length === 0 ? (
                                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No events found.</td></tr>
                                        ) : (
                                            events.map((event) => (
                                                <tr key={event._id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">{getSeverityBadge(event.severity)}</td>
                                                    <td className="px-6 py-4 font-medium text-slate-700 capitalize">{event.type.replace(/_/g, ' ')}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            {event.userId ? <span className="font-medium text-indigo-600">{event.userId.email}</span> : <span className="text-slate-400 italic">Unidentified</span>}
                                                            <div className="flex items-center text-xs text-slate-500 mt-1 gap-1"><Globe className="h-3 w-3" /><span className="font-mono">{event.ipAddress}</span></div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{JSON.stringify(event.details || {})}</td>
                                                    <td className="px-6 py-4 text-right text-slate-500 whitespace-nowrap"><div className="flex items-center justify-end gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" />{new Date(event.createdAt).toLocaleString()}</div></td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {totalPages > 1 && (
                                <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                                    <div className="text-xs text-slate-500">Page {page} of {totalPages}</div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => fetchEvents(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => fetchEvents(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* INCIDENT RESPONSE TAB */}
                <TabsContent value="incident_response" className="space-y-6">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Siren className="h-5 w-5 text-red-600" />
                                <CardTitle>Active Incidents</CardTitle>
                            </div>
                            <CardDescription>Manage and resolve high-priority security incidents.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-slate-200 overflow-hidden">
                                {events.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0 ? (
                                    <div className="p-8 text-center bg-slate-50">
                                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                                        <h3 className="text-lg font-medium text-slate-900">All Clear</h3>
                                        <p className="text-slate-500">No active critical or high severity incidents detected.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {events.filter(e => e.severity === 'critical' || e.severity === 'high').map(incident => (
                                            <div key={incident._id} className="p-4 bg-red-50/10 hover:bg-red-50/30 transition-colors flex items-center justify-between">
                                                <div className="flex items-start gap-3">
                                                    <AlertTriangle className="h-5 w-5 text-red-500 mt-1" />
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-slate-900 capitalize">{incident.type.replace(/_/g, ' ')}</h4>
                                                            {getSeverityBadge(incident.severity)}
                                                        </div>
                                                        <div className="text-sm text-slate-600 mt-1">
                                                            Detected on {incident.ipAddress} affecting {incident.userId?.email || 'Unknown User'}
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-1">
                                                            {new Date(incident.createdAt).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline">Investigate</Button>
                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700">Resolve</Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="mt-6">
                                <h3 className="font-semibold text-slate-900 mb-2">Internal Playbooks</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Button variant="outline" className="justify-start h-auto py-3">
                                        <div className="text-left">
                                            <div className="font-medium">Account Compromise</div>
                                            <div className="text-xs text-slate-500">Steps to lock down and recover account</div>
                                        </div>
                                    </Button>
                                    <Button variant="outline" className="justify-start h-auto py-3">
                                        <div className="text-left">
                                            <div className="font-medium">DDoS Mitigation</div>
                                            <div className="text-xs text-slate-500">Enable Cloudflare Under Attack mode</div>
                                        </div>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* FORENSICS TAB */}
                <TabsContent value="forensics" className="space-y-6">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <FileSearch className="h-5 w-5 text-indigo-600" />
                                <CardTitle>Digital Forensics</CardTitle>
                            </div>
                            <CardDescription>Search and analyze entity behavior patterns.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex gap-4">
                                <div className="flex-1 max-w-lg">
                                    <Input
                                        placeholder="Enter IP Address, User Email, or Event ID..."
                                        value={forensicQuery}
                                        onChange={(e) => setForensicQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && runForensicAnalysis()}
                                    />
                                </div>
                                <Button onClick={runForensicAnalysis}>
                                    <Search className="h-4 w-4 mr-2" />
                                    Analyze Entity
                                </Button>
                            </div>

                            {forensicResults.length > 0 && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <Separator className="my-6" />
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                                        <h3 className="font-semibold text-slate-900 mb-2">Analysis Report</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="text-slate-500 block">Events Found</span>
                                                <span className="font-bold text-slate-900">{forensicResults.length}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block">Risk Score</span>
                                                <span className="font-bold text-orange-600">Medium</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block">First Seen</span>
                                                <span className="font-mono text-slate-700">{new Date(forensicResults[forensicResults.length - 1].createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block">Last Activity</span>
                                                <span className="font-mono text-slate-700">{new Date(forensicResults[0].createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-slate-900">Timeline of Activity</h4>
                                        <div className="border border-slate-200 rounded-md divide-y divide-slate-100">
                                            {forensicResults.map(event => (
                                                <div key={event._id} className="p-3 bg-white text-sm flex gap-4">
                                                    <div className="w-32 shrink-0 text-slate-500 text-xs">
                                                        {new Date(event.createdAt).toLocaleString()}
                                                    </div>
                                                    <div>
                                                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${event.severity === 'critical' ? 'bg-red-500' : 'bg-slate-300'}`}></span>
                                                        <span className="font-medium text-slate-900 capitalize">{event.type.replace(/_/g, ' ')}</span>
                                                        <span className="text-slate-500 mx-2">-</span>
                                                        <span className="text-slate-600">{JSON.stringify(event.details)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {forensicQuery && forensicResults.length === 0 && (
                                <div className="text-center py-12 text-slate-400">
                                    <FileSearch className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                    <p>No records found matching this query in the local buffer.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SETTINGS TAB */}
                <TabsContent value="settings">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Authentication Settings */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Key className="h-5 w-5 text-indigo-600" />
                                    <CardTitle>Authentication</CardTitle>
                                </div>
                                <CardDescription>Control how users authenticate.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-900">Strong Passwords</p>
                                        <p className="text-xs text-slate-500">Require minimum 8 characters, symbols, numbers</p>
                                    </div>
                                    <Switch checked={settings.enforceStrongPasswords} onCheckedChange={() => handleToggle('enforceStrongPasswords')} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-900">Google OAuth</p>
                                        <p className="text-xs text-slate-500">Allow login via Google accounts</p>
                                    </div>
                                    <Switch checked={settings.allowGoogleAuth} onCheckedChange={() => handleToggle('allowGoogleAuth')} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-900">Two-Factor Authentication</p>
                                        <p className="text-xs text-slate-500">Enable optional 2FA for users</p>
                                    </div>
                                    <Switch checked={settings.enable2FA} onCheckedChange={() => handleToggle('enable2FA')} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-900">Login Alerts</p>
                                        <p className="text-xs text-slate-500">Send email alerts for new logins</p>
                                    </div>
                                    <Switch checked={settings.loginAlertEnabled} onCheckedChange={() => handleToggle('loginAlertEnabled')} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Session & Rate Limiting */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Lock className="h-5 w-5 text-purple-600" />
                                    <CardTitle>Rate Limiting</CardTitle>
                                </div>
                                <CardDescription>Prevent brute-force attacks.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-900">Rate Limiting</p>
                                        <p className="text-xs text-slate-500">Enable rate limiting protection</p>
                                    </div>
                                    <Switch checked={settings.rateLimitEnabled} onCheckedChange={() => handleToggle('rateLimitEnabled')} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-900">Session Timeout</p>
                                        <p className="text-xs text-slate-500">Auto logout after inactivity (minutes)</p>
                                    </div>
                                    <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">{settings.sessionTimeout} min</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-900">Max Login Attempts</p>
                                        <p className="text-xs text-slate-500">Lock account after failed attempts</p>
                                    </div>
                                    <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">{settings.maxLoginAttempts}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-900">Activity Monitoring</p>
                                        <p className="text-xs text-slate-500">Monitor for suspicious activity</p>
                                    </div>
                                    <Switch checked={settings.suspiciousActivityMonitoring} onCheckedChange={() => handleToggle('suspiciousActivityMonitoring')} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <Card className="border-slate-200 shadow-sm md:col-span-2">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                                    <CardTitle>Danger Zone</CardTitle>
                                </div>
                                <CardDescription>Sensitive actions requiring confirmation.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-4">
                                <Button
                                    variant="outline"
                                    className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                    onClick={handleRotateApiKeys}
                                    disabled={actionLoading === 'rotate'}
                                >
                                    {actionLoading === 'rotate' ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                    )}
                                    Rotate API Keys
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={handleForceLogout}
                                    disabled={actionLoading === 'logout'}
                                >
                                    {actionLoading === 'logout' ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Lock className="mr-2 h-4 w-4" />
                                    )}
                                    Force Logout All Users
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-end mt-6">
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
