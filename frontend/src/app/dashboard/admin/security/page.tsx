'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Shield, Key, Lock, AlertTriangle, RefreshCw } from 'lucide-react';

export default function AdminSecurity() {
    const [settings, setSettings] = useState({
        enforceStrongPasswords: true,
        enable2FA: false,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        allowGoogleAuth: true,
    });

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

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
                        <Button variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Rotate API Keys
                        </Button>
                        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                            <Lock className="mr-2 h-4 w-4" />
                            Force Logout All Users
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <Button>Save Changes</Button>
            </div>
        </div>
    );
}
