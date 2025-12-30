'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    TrendingUp,
    Users,
    CreditCard,
    RefreshCcw,
    AlertCircle,
    Check,
    X,
    Search,
    ChevronLeft,
    ChevronRight,
    IndianRupee,
    Calendar,
    Undo2,
    Loader2,
    ArrowLeft,
    Crown,
    Rocket,
    Building2,
    Zap
} from 'lucide-react';

interface RevenueStats {
    overview: {
        totalRevenue: number;
        todayRevenue: number;
        monthRevenue: number;
        totalRefunds: number;
        refundCount: number;
        pendingRefunds: number;
        totalPaidUsers: number;
    };
    revenueByPlan: Array<{ plan: string; total: number; count: number }>;
    revenueByMethod: Array<{ method: string; total: number; count: number }>;
    monthlyRevenue: Array<{ year: number; month: number; total: number; count: number }>;
    activeSubscriptions: Array<{ plan: string; count: number }>;
}

interface Payment {
    _id: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    user: {
        _id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    amount: number;
    currency: string;
    status: string;
    plan: string;
    method: string;
    bank?: string;
    wallet?: string;
    vpa?: string;
    refundAmount?: number;
    refundStatus?: string;
    refundedAt?: string;
    paidAt: string;
    createdAt: string;
}

interface CancelledSubscription {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    plan: string;
    status: string;
    currentPeriodEnd: string;
    cancelledAt: string;
    cancelReason: string;
    lastPayment: {
        amount: number;
        paidAt: string;
        razorpayPaymentId: string;
    } | null;
    refundInfo: {
        eligible: boolean;
        amount: number;
        daysRemaining: number;
    };
}

export default function AdminRevenuePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<RevenueStats | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [cancelledSubs, setCancelledSubs] = useState<CancelledSubscription[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'cancelled'>('overview');
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [planFilter, setPlanFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // Modals
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        checkAdminAccess();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (activeTab === 'overview') {
            loadStats();
        } else if (activeTab === 'payments') {
            loadPayments();
        } else if (activeTab === 'cancelled') {
            loadCancelledSubscriptions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, currentPage, statusFilter, planFilter, searchQuery]);

    const checkAdminAccess = async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const user = await res.json();
            if (user.role !== 'admin') {
                router.push('/dashboard');
                return;
            }
            loadStats();
        } catch (err) {
            console.error(err);
            router.push('/dashboard');
        }
    };

    const loadStats = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_URL}/admin/revenue/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Failed to load stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadPayments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '20',
                ...(statusFilter && { status: statusFilter }),
                ...(planFilter && { plan: planFilter }),
                ...(searchQuery && { search: searchQuery })
            });
            
            const res = await fetch(`${API_URL}/admin/revenue/payments?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPayments(data.payments);
                setTotalPages(data.pagination.pages);
            }
        } catch (err) {
            console.error('Failed to load payments:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadCancelledSubscriptions = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_URL}/admin/revenue/cancelled?page=${currentPage}&limit=20`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCancelledSubs(data.subscriptions);
                setTotalPages(data.pagination.pages);
            }
        } catch (err) {
            console.error('Failed to load cancelled subscriptions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefund = async () => {
        if (!selectedPayment) return;
        
        setProcessing(true);
        setError('');
        
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_URL}/admin/revenue/refund/${selectedPayment._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: refundAmount ? parseFloat(refundAmount) : null,
                    reason: refundReason
                })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                setSuccessMessage('Refund processed successfully!');
                setShowRefundModal(false);
                setSelectedPayment(null);
                setRefundAmount('');
                setRefundReason('');
                loadPayments();
            } else {
                setError(data.message || 'Failed to process refund');
            }
        } catch {
            setError('Failed to process refund');
        } finally {
            setProcessing(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            paid: 'bg-green-100 text-green-800',
            created: 'bg-yellow-100 text-yellow-800',
            failed: 'bg-red-100 text-red-800',
            refunded: 'bg-purple-100 text-purple-800',
            expired: 'bg-gray-100 text-gray-800'
        };
        return styles[status] || 'bg-gray-100 text-gray-800';
    };

    const getPlanIcon = (plan: string) => {
        switch (plan) {
            case 'starter':
                return <Rocket className="h-4 w-4 text-blue-500" />;
            case 'pro':
                return <Crown className="h-4 w-4 text-yellow-500" />;
            case 'enterprise':
                return <Building2 className="h-4 w-4 text-purple-600" />;
            default:
                return <Zap className="h-4 w-4 text-gray-500" />;
        }
    };

    const getMethodLabel = (method: string) => {
        const labels: Record<string, string> = {
            card: 'Card',
            upi: 'UPI',
            netbanking: 'Net Banking',
            wallet: 'Wallet'
        };
        return labels[method] || method || 'Unknown';
    };

    const getMonthName = (month: number) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[month - 1];
    };

    if (loading && !stats) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/admin')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Admin Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <IndianRupee className="h-8 w-8 text-green-600" />
                        Revenue Management
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Track payments, subscriptions, and manage refunds
                    </p>
                </div>

                {/* Success/Error Messages */}
                {successMessage && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-green-800">{successMessage}</span>
                        <button onClick={() => setSuccessMessage('')} className="ml-auto">
                            <X className="h-5 w-5 text-green-600" />
                        </button>
                    </div>
                )}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="text-red-800">{error}</span>
                        <button onClick={() => setError('')} className="ml-auto">
                            <X className="h-5 w-5 text-red-600" />
                        </button>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                    {[
                        { id: 'overview', label: 'Overview', icon: TrendingUp },
                        { id: 'payments', label: 'All Payments', icon: CreditCard },
                        { id: 'cancelled', label: 'Cancelled & Refunds', icon: RefreshCcw }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id as 'overview' | 'payments' | 'cancelled');
                                setCurrentPage(1);
                            }}
                            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && stats && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-500 dark:text-gray-400 text-sm">Total Revenue</span>
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                        <IndianRupee className="h-5 w-5 text-green-600" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(stats.overview.totalRevenue)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">All time</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-500 dark:text-gray-400 text-sm">This Month</span>
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <Calendar className="h-5 w-5 text-blue-600" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(stats.overview.monthRevenue)}
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                    Today: {formatCurrency(stats.overview.todayRevenue)}
                                </p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-500 dark:text-gray-400 text-sm">Active Subscribers</span>
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                        <Users className="h-5 w-5 text-indigo-600" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.overview.totalPaidUsers}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Paid plans</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-500 dark:text-gray-400 text-sm">Refunds</span>
                                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                        <Undo2 className="h-5 w-5 text-red-600" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(stats.overview.totalRefunds)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {stats.overview.refundCount} refunds • {stats.overview.pendingRefunds} pending
                                </p>
                            </div>
                        </div>

                        {/* Revenue by Plan & Method */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Revenue by Plan
                                </h3>
                                <div className="space-y-4">
                                    {stats.revenueByPlan.map(item => (
                                        <div key={item.plan} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {getPlanIcon(item.plan)}
                                                <span className="text-gray-700 dark:text-gray-300 capitalize">
                                                    {item.plan}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {formatCurrency(item.total)}
                                                </p>
                                                <p className="text-xs text-gray-500">{item.count} payments</p>
                                            </div>
                                        </div>
                                    ))}
                                    {stats.revenueByPlan.length === 0 && (
                                        <p className="text-gray-500 text-center py-4">No payments yet</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Payment Methods
                                </h3>
                                <div className="space-y-4">
                                    {stats.revenueByMethod.map(item => (
                                        <div key={item.method} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="h-4 w-4 text-gray-500" />
                                                <span className="text-gray-700 dark:text-gray-300">
                                                    {getMethodLabel(item.method)}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {formatCurrency(item.total)}
                                                </p>
                                                <p className="text-xs text-gray-500">{item.count} payments</p>
                                            </div>
                                        </div>
                                    ))}
                                    {stats.revenueByMethod.length === 0 && (
                                        <p className="text-gray-500 text-center py-4">No payments yet</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Monthly Revenue Chart */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Monthly Revenue (Last 12 Months)
                            </h3>
                            <div className="flex items-end justify-between gap-2 h-48">
                                {stats.monthlyRevenue.length > 0 ? (
                                    stats.monthlyRevenue.map((item, idx) => {
                                        const maxRevenue = Math.max(...stats.monthlyRevenue.map(m => m.total));
                                        const height = maxRevenue > 0 ? (item.total / maxRevenue) * 100 : 0;
                                        return (
                                            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                                <div className="w-full flex flex-col items-center justify-end h-36">
                                                    <div
                                                        className="w-full bg-indigo-500 rounded-t transition-all hover:bg-indigo-600"
                                                        style={{ height: `${Math.max(height, 4)}%` }}
                                                        title={`${formatCurrency(item.total)} (${item.count} payments)`}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {getMonthName(item.month)}
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-gray-500 text-center w-full py-8">No revenue data yet</p>
                                )}
                            </div>
                        </div>

                        {/* Active Subscriptions */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Active Subscriptions
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {stats.activeSubscriptions.map(item => (
                                    <div key={item.plan} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            {getPlanIcon(item.plan)}
                                            <span className="text-gray-700 dark:text-gray-300 capitalize font-medium">
                                                {item.plan}
                                            </span>
                                        </div>
                                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                                            {item.count}
                                        </span>
                                    </div>
                                ))}
                                {stats.activeSubscriptions.length === 0 && (
                                    <p className="text-gray-500 col-span-3 text-center py-4">No active paid subscriptions</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Payments Tab */}
                {activeTab === 'payments' && (
                    <div className="space-y-4">
                        {/* Filters */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex flex-wrap gap-4">
                                <div className="flex-1 min-w-[200px]">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by Payment ID..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">All Status</option>
                                    <option value="paid">Paid</option>
                                    <option value="created">Created</option>
                                    <option value="failed">Failed</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                                <select
                                    value={planFilter}
                                    onChange={(e) => setPlanFilter(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">All Plans</option>
                                    <option value="starter">Starter</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>
                        </div>

                        {/* Payments Table */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">User</th>
                                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Plan</th>
                                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Method</th>
                                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {payments.map(payment => (
                                                <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                    <td className="py-3 px-4">
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                {payment.user?.name || 'Unknown'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{payment.user?.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            {getPlanIcon(payment.plan)}
                                                            <span className="capitalize text-gray-700 dark:text-gray-300">
                                                                {payment.plan}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            {formatCurrency(payment.amount)}
                                                        </span>
                                                        {payment.refundAmount && (
                                                            <p className="text-xs text-red-500">
                                                                Refunded: {formatCurrency(payment.refundAmount)}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                                                        {getMethodLabel(payment.method)}
                                                        {payment.vpa && <span className="text-xs ml-1">({payment.vpa})</span>}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(payment.status)}`}>
                                                            {payment.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                                        {payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt)}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            {payment.status === 'paid' && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedPayment(payment);
                                                                        setRefundAmount(payment.amount.toString());
                                                                        setShowRefundModal(true);
                                                                    }}
                                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                                                    title="Refund"
                                                                >
                                                                    <Undo2 className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {payments.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="py-12 text-center text-gray-500">
                                                        No payments found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </button>
                                    <span className="text-sm text-gray-600">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Cancelled Subscriptions Tab */}
                {activeTab === 'cancelled' && (
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">User</th>
                                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Plan</th>
                                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Cancelled On</th>
                                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Reason</th>
                                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Expires On</th>
                                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Last Payment</th>
                                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Refund Eligibility</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {cancelledSubs.map(sub => (
                                                <tr key={sub._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                    <td className="py-3 px-4">
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                {sub.userId?.name || 'Unknown'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{sub.userId?.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            {getPlanIcon(sub.plan)}
                                                            <span className="capitalize text-gray-700 dark:text-gray-300">
                                                                {sub.plan}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                                        {formatDate(sub.cancelledAt)}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate">
                                                        {sub.cancelReason || '-'}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                                        {sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : '-'}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {sub.lastPayment ? (
                                                            <div>
                                                                <p className="font-medium text-gray-900 dark:text-white">
                                                                    {formatCurrency(sub.lastPayment.amount)}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {formatDate(sub.lastPayment.paidAt)}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {sub.refundInfo.eligible ? (
                                                            <div>
                                                                <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    Eligible
                                                                </span>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    ~{formatCurrency(sub.refundInfo.amount)} ({sub.refundInfo.daysRemaining} days left)
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                                Not Eligible
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {cancelledSubs.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="py-12 text-center text-gray-500">
                                                        No cancelled subscriptions
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </button>
                                    <span className="text-sm text-gray-600">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Refund Modal */}
            {showRefundModal && selectedPayment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <Undo2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Process Refund
                            </h3>
                        </div>

                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>User:</strong> {selectedPayment.user?.name} ({selectedPayment.user?.email})
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Original Amount:</strong> {formatCurrency(selectedPayment.amount)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Payment ID:</strong> {selectedPayment.razorpayPaymentId}
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Refund Amount (₹)
                            </label>
                            <input
                                type="number"
                                value={refundAmount}
                                onChange={(e) => setRefundAmount(e.target.value)}
                                max={selectedPayment.amount}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Leave as is for full refund, or enter partial amount
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Reason for Refund
                            </label>
                            <select
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="">Select reason...</option>
                                <option value="Customer request">Customer request</option>
                                <option value="Service issue">Service issue</option>
                                <option value="Duplicate payment">Duplicate payment</option>
                                <option value="Unauthorized transaction">Unauthorized transaction</option>
                                <option value="Prorated refund">Prorated refund</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                <strong>Warning:</strong> This will process the refund and downgrade the user to the Free plan.
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowRefundModal(false);
                                    setSelectedPayment(null);
                                    setRefundAmount('');
                                    setRefundReason('');
                                }}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRefund}
                                disabled={processing || !refundReason}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 font-medium"
                            >
                                {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                                Process Refund
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
