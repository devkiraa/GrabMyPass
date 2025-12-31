'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Shield, Key, Lock, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

export default function AdminSecurity() {
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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const { toast } = useToast();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    // Fetch settings on mount
    useEffect(() => {
        fetchSettings();
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
            toast({
                title: "Error",
                description: "Failed to load security settings",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (key: keyof SecuritySettings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch(`${API_URL}/admin/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ securitySettings: settings })
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Security settings updated successfully"
                });
            } else {
                throw new Error('Failed to update settings');
            }
        } catch (error) {
            console.error('Failed to save security settings:', error);
            toast({
                title: "Error",
                description: "Failed to update security settings",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleForceLogout = async () => {
        if (!confirm('Are you sure you want to force logout all users? This will log out everyone currently using the platform.')) {
            return;
        }

        setActionLoading('logout');
        try {
            const response = await fetch(`${API_URL}/admin/security/force-logout-all`, {
                method: 'POST'
            });

            if (response.ok) {
                const data = await response.json();
                toast({
                    title: "Success",
                    description: `Successfully logged out all users (${data.sessionsCleared} sessions cleared)`
                });
            } else {
                throw new Error('Failed to force logout');
            }
        } catch (error) {
            console.error('Failed to force logout:', error);
            toast({
                title: "Error",
                description: "Failed to force logout all users",
                variant: "destructive"
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleRotateApiKeys = async () => {
        if (!confirm('Are you sure you want to rotate API keys? All existing API keys will be invalidated and users will need to generate new ones.')) {
            return;
        }

        setActionLoading('rotate');
        try {
            const response = await fetch(`${API_URL}/admin/security/rotate-api-keys`, {
                method: 'POST'
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "API keys rotated successfully"
                });
            } else {
                throw new Error('Failed to rotate API keys');
            }
        } catch (error) {
            console.error('Failed to rotate API keys:', error);
            toast({
                title: "Error",
                description: "Failed to rotate API keys",
                variant: "destructive"
            });
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Security Settings</h1>
                    <p className="text-slate-500">Configure platform-wide security policies.</p>
                </div>
            </div>

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

            <div className="flex justify-end">
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
        </div>
    );
}
