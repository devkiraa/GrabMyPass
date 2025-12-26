'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard, Trash2, Edit, Eye } from 'lucide-react';

interface TicketTemplate {
    _id: string;
    name: string;
    description: string;
    previewUrl?: string;
    isGlobal: boolean;
    createdAt: string;
}

export default function AdminTicketTemplates() {
    const [templates, setTemplates] = useState<TicketTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: Fetch global ticket templates from API
        setLoading(false);
        // Placeholder data
        setTemplates([
            { _id: '1', name: 'Modern Minimal', description: 'Clean, minimalist ticket design with QR code', isGlobal: true, createdAt: new Date().toISOString() },
            { _id: '2', name: 'Event Pass Pro', description: 'Professional event pass with photo and barcode', isGlobal: true, createdAt: new Date().toISOString() },
            { _id: '3', name: 'Conference Badge', description: 'Standard conference badge layout', isGlobal: true, createdAt: new Date().toISOString() },
        ]);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Ticket Templates</h1>
                    <p className="text-slate-500">Manage global ticket designs available to all users.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Template
                </Button>
            </div>

            {loading ? (
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-lg" />)}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                        <Card key={template._id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5 text-purple-600" />
                                        <CardTitle className="text-lg">{template.name}</CardTitle>
                                    </div>
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Global</span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-600 mb-4">{template.description}</p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm">
                                        <Eye className="mr-1 h-3 w-3" />
                                        Preview
                                    </Button>
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
