'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Mail, Trash2, Edit } from 'lucide-react';

interface EmailTemplate {
    _id: string;
    name: string;
    subject: string;
    description: string;
    isGlobal: boolean;
    createdAt: string;
}

export default function AdminEmailTemplates() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: Fetch global email templates from API
        setLoading(false);
        // Placeholder data
        setTemplates([
            { _id: '1', name: 'Welcome Email', subject: 'Welcome to {{event_name}}!', description: 'Default welcome email for new registrations', isGlobal: true, createdAt: new Date().toISOString() },
            { _id: '2', name: 'Reminder Email', subject: 'Reminder: {{event_name}} is tomorrow!', description: 'Automated reminder sent 24h before event', isGlobal: true, createdAt: new Date().toISOString() },
        ]);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Email Templates</h1>
                    <p className="text-slate-500">Manage global email templates available to all users.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Template
                </Button>
            </div>

            {loading ? (
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-lg" />)}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                        <Card key={template._id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-5 w-5 text-indigo-600" />
                                        <CardTitle className="text-lg">{template.name}</CardTitle>
                                    </div>
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Global</span>
                                </div>
                                <CardDescription className="text-xs">{template.subject}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-600 mb-4">{template.description}</p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm">
                                        <Edit className="mr-1 h-3 w-3" />
                                        Edit
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                        <Trash2 className="mr-1 h-3 w-3" />
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
