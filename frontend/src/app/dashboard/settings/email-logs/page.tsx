'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    ArrowLeft,
    Mail,
    Loader2,
    CheckCircle2,
    XCircle,
    Search,
    RefreshCw,
    Clock,
    User,
    Calendar,
    ExternalLink,
    Filter,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

interface EmailLog {
    _id: string;
    type: string;
    fromEmail: string;
    toEmail: string;
    toName?: string;
    subject: string;
    status: 'sent' | 'failed' | 'pending' | 'bounced';
    eventTitle?: string;
    ticketCode?: string;
    templateName?: string;
    errorMessage?: string;
    sentAt: string;
    createdAt: string;
}

interface Stats {
    total: number;
    sent: number;
    failed: number;
    successRate: number;
    byType: Record<string, number>;
}

export default function EmailLogsPage() {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<EmailLog[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });
    const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

    useEffect(() => {
        fetchLogs();
        fetchStats();
    }, [page, typeFilter, statusFilter]);

    const fetchLogs = async () => {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(typeFilter && { type: typeFilter }),
                ...(statusFilter && { status: statusFilter }),
                ...(searchTerm && { search: searchTerm })
            });

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/email/logs?${params}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
                setPagination(data.pagination);
            }
        } catch (err) {
            console.error('Failed to fetch logs', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        const token = localStorage.getItem('auth_token');
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/email/logs/stats`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (res.ok) {
                setStats(await res.json());
            }
        } catch (err) {
            console.error('Failed to fetch stats', err);
        }
    };

    const handleSearch = () => {
        setPage(1);
        fetchLogs();
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const statusColors: Record<string, string> = {
        sent: 'bg-green-100 text-green-700',
        failed: 'bg-red-100 text-red-700',
        pending: 'bg-amber-100 text-amber-700',
        bounced: 'bg-orange-100 text-orange-700'
    };

    const typeColors: Record<string, string> = {
        registration: 'bg-indigo-100 text-indigo-700',
        reminder: 'bg-blue-100 text-blue-700',
        update: 'bg-amber-100 text-amber-700',
        cancellation: 'bg-red-100 text-red-700',
        test: 'bg-purple-100 text-purple-700',
        custom: 'bg-slate-100 text-slate-700'
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/settings/emails" className="text-slate-500 hover:text-slate-900">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Email Logs</h1>
                        <p className="text-slate-500">Track all sent emails and their status</p>
                    </div>
                </div>
                <Button variant="outline" onClick={() => { fetchLogs(); fetchStats(); }}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Total Sent</p>
                                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                                </div>
                                <div className="p-3 bg-indigo-100 rounded-full">
                                    <Mail className="w-6 h-6 text-indigo-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Successful</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-full">
                                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Failed</p>
                                    <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                                </div>
                                <div className="p-3 bg-red-100 rounded-full">
                                    <XCircle className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Success Rate</p>
                                    <p className="text-2xl font-bold text-slate-900">{stats.successRate}%</p>
                                </div>
                                <div className="p-3 bg-slate-100 rounded-full">
                                    <Clock className="w-6 h-6 text-slate-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search by email, name, or subject..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <select
                            value={typeFilter}
                            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                            className="h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
                        >
                            <option value="">All Types</option>
                            <option value="registration">Registration</option>
                            <option value="reminder">Reminder</option>
                            <option value="update">Update</option>
                            <option value="cancellation">Cancellation</option>
                            <option value="test">Test</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
                        >
                            <option value="">All Status</option>
                            <option value="sent">Sent</option>
                            <option value="failed">Failed</option>
                            <option value="pending">Pending</option>
                        </select>
                        <Button onClick={handleSearch}>
                            <Filter className="w-4 h-4 mr-2" /> Filter
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle>Email History</CardTitle>
                    <CardDescription>
                        {pagination.total} emails found
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12">
                            <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="font-semibold text-slate-900 mb-2">No emails sent yet</h3>
                            <p className="text-slate-500 text-sm">
                                Email logs will appear here once you send confirmation emails
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Status</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Recipient</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Subject</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Type</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Event</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Sent At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr
                                            key={log._id}
                                            className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                                            onClick={() => setSelectedLog(log)}
                                        >
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[log.status]}`}>
                                                    {log.status === 'sent' ? (
                                                        <CheckCircle2 className="w-3 h-3" />
                                                    ) : (
                                                        <XCircle className="w-3 h-3" />
                                                    )}
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-medium text-slate-900">{log.toName || 'Unknown'}</p>
                                                    <p className="text-sm text-slate-500">{log.toEmail}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-sm text-slate-700 max-w-[200px] truncate" title={log.subject}>
                                                    {log.subject}
                                                </p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[log.type]}`}>
                                                    {log.type}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-sm text-slate-600 max-w-[150px] truncate">
                                                    {log.eventTitle || '-'}
                                                </p>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-500">
                                                {formatDate(log.sentAt || log.createdAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t">
                            <p className="text-sm text-slate-500">
                                Page {page} of {pagination.pages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                    disabled={page === pagination.pages}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">Email Details</h3>
                                    <p className="text-sm text-slate-500">{formatDate(selectedLog.sentAt || selectedLog.createdAt)}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[selectedLog.status]}`}>
                                        {selectedLog.status === 'sent' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        {selectedLog.status.charAt(0).toUpperCase() + selectedLog.status.slice(1)}
                                    </span>
                                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${typeColors[selectedLog.type]}`}>
                                        {selectedLog.type}
                                    </span>
                                </div>

                                <div className="grid gap-4">
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-500 mb-1">From</p>
                                        <p className="font-medium text-slate-900">{selectedLog.fromEmail}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-500 mb-1">To</p>
                                        <p className="font-medium text-slate-900">{selectedLog.toName || 'Unknown'}</p>
                                        <p className="text-sm text-slate-600">{selectedLog.toEmail}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-500 mb-1">Subject</p>
                                        <p className="font-medium text-slate-900">{selectedLog.subject}</p>
                                    </div>
                                    {selectedLog.eventTitle && (
                                        <div className="p-4 bg-slate-50 rounded-lg">
                                            <p className="text-xs text-slate-500 mb-1">Event</p>
                                            <p className="font-medium text-slate-900">{selectedLog.eventTitle}</p>
                                        </div>
                                    )}
                                    {selectedLog.ticketCode && (
                                        <div className="p-4 bg-slate-50 rounded-lg">
                                            <p className="text-xs text-slate-500 mb-1">Ticket Code</p>
                                            <p className="font-mono font-bold text-indigo-600">{selectedLog.ticketCode}</p>
                                        </div>
                                    )}
                                    {selectedLog.templateName && (
                                        <div className="p-4 bg-slate-50 rounded-lg">
                                            <p className="text-xs text-slate-500 mb-1">Template Used</p>
                                            <p className="font-medium text-slate-900">{selectedLog.templateName}</p>
                                        </div>
                                    )}
                                    {selectedLog.errorMessage && (
                                        <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                                            <p className="text-xs text-red-500 mb-1">Error Message</p>
                                            <p className="font-medium text-red-700">{selectedLog.errorMessage}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t">
                                <Button variant="outline" onClick={() => setSelectedLog(null)} className="w-full">
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
