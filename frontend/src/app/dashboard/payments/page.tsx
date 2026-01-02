'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
    CheckCircle,
    XCircle,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon,
    Sparkles,
    Mail,
    Maximize2,
    AlertTriangle,
    Tag,
    User as UserIcon,
    Ticket as TicketIcon
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

interface PaymentProof {
    screenshotUrl: string;
    utr: string;
    amount: number;
    uploadedAt: string;
    verificationStatus: 'pending' | 'verified' | 'rejected' | 'not_required';
    verifiedAt?: string;
    verificationMethod?: string;
    rejectionReason?: string;
}

interface PendingPayment {
    _id: string;
    eventId: {
        _id: string;
        title: string;
        slug: string;
        price: number;
    };
    userId?: {
        name: string;
        email: string;
    };
    guestEmail?: string;
    guestName?: string;
    pricePaid: number;
    paymentProof: PaymentProof;
    formData: any;
    createdAt: string;
    isDuplicateUtr?: boolean;
}

export default function PaymentVerificationPage() {
    const { toast } = useToast();
    const [payments, setPayments] = useState<PendingPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal States
    const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
    const [verifyModalOpen, setVerifyModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [autoVerifyModalOpen, setAutoVerifyModalOpen] = useState(false);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [statementText, setStatementText] = useState('');
    const [statementFile, setStatementFile] = useState<File | null>(null);

    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
    const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

    const fetchPayments = async (p: number) => {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        setLoading(true);
        try {
            const res = await fetch(
                `${apiUrl}/payment-verification/pending-payments?page=${p}&limit=12`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                const data = await res.json();
                setPayments(data.payments);
                setTotalPages(data.pages);
                setPage(data.page);
            } else {
                toast({ title: 'Error', description: 'Failed to load payments', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to fetch payments', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments(1);
    }, []);

    const handleVerify = async () => {
        if (!selectedPayment) return;
        const token = localStorage.getItem('auth_token');
        setActionLoading(true);

        try {
            const res = await fetch(
                `${apiUrl}/payment/tickets/${selectedPayment._id}/verify-manual`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: 'verified' })
                }
            );

            if (res.ok) {
                toast({ title: 'Success', description: 'Payment verified successfully' });
                setVerifyModalOpen(false);
                fetchPayments(page);
            } else {
                toast({ title: 'Error', description: 'Failed to verify payment', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Verification failed', variant: 'destructive' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedPayment) return;
        const token = localStorage.getItem('auth_token');
        setActionLoading(true);

        try {
            const res = await fetch(
                `${apiUrl}/payment/tickets/${selectedPayment._id}/verify-manual`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        status: 'rejected',
                        rejectionReason
                    })
                }
            );

            if (res.ok) {
                toast({ title: 'Success', description: 'Payment rejected' });
                setRejectModalOpen(false);
                setRejectionReason('');
                fetchPayments(page);
            } else {
                toast({ title: 'Error', description: 'Failed to reject payment', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Rejection failed', variant: 'destructive' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleAutoVerify = async () => {
        if (!selectedPayment) return;
        const token = localStorage.getItem('auth_token');
        setActionLoading(true);

        try {
            const res = await fetch(
                `${apiUrl}/payment-verification/tickets/${selectedPayment._id}/verify-auto`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        statementText,
                        date: new Date(selectedPayment.paymentProof.uploadedAt).toISOString().split('T')[0]
                    })
                }
            );

            const result = await res.json();

            if (res.ok) {
                if (result.result.status === 'VERIFIED') {
                    toast({ title: 'Auto-Verified', description: 'Payment automatically verified!' });
                } else if (result.result.status === 'NOT_FOUND') {
                    toast({ title: 'Not Found', description: 'UTR not found in statement', variant: 'destructive' });
                } else {
                    toast({ title: 'Manual Review', description: 'Needs manual verification', variant: 'default' });
                }
                setAutoVerifyModalOpen(false);
                setStatementText('');
                fetchPayments(page);
            } else {
                toast({ title: 'Error', description: result.message || 'Auto-verification failed', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Auto-verification failed', variant: 'destructive' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            setStatementFile(file);
            toast({ title: 'Info', description: 'PDF text extraction would happen here. For now, paste text manually.' });
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="max-w-[1400px] mx-auto p-4 md:p-6">
                {/* Compact Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                            Payment Verification
                        </h1>
                        <p className="text-gray-500 text-sm font-medium">
                            Efficiently process {payments.length} pending registrations.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="bg-white border-gray-200 rounded-none h-10 px-4 font-bold text-xs uppercase tracking-wider"
                            onClick={() => fetchPayments(1)}
                        >
                            Refresh
                        </Button>
                        <div className="h-10 px-4 bg-gray-900 text-white flex items-center font-black text-sm">
                            {payments.length} PENDING
                        </div>
                    </div>
                </div>

                {loading && payments.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="h-64 bg-white animate-pulse border border-gray-100" />
                        ))}
                    </div>
                ) : payments.length === 0 ? (
                    <div className="py-20 bg-white border border-gray-100 flex flex-col items-center justify-center text-center">
                        <CheckCircle className="w-12 h-12 text-[#00CC68] mb-4 opacity-20" />
                        <h3 className="text-lg font-bold text-gray-900">All Clear</h3>
                        <p className="text-gray-400 text-sm">No payments waiting for review.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {payments.map((payment) => (
                            <Card key={payment._id} className="group flex flex-col bg-white border border-gray-200 rounded-none overflow-hidden transition-all hover:border-gray-900 hover:shadow-lg">
                                {/* Compact Screenshot */}
                                <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden cursor-zoom-in"
                                    onClick={() => {
                                        setSelectedPayment(payment);
                                        setImageModalOpen(true);
                                    }}>
                                    {payment.paymentProof.screenshotUrl ? (
                                        <img
                                            src={`${baseUrl}${payment.paymentProof.screenshotUrl}`}
                                            alt="Payment"
                                            className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = 'https://placehold.co/400x300/f3f4f6/9ca3af?text=Image+Error';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                            <ImageIcon className="w-8 h-8 text-gray-300" strokeWidth={1} />
                                        </div>
                                    )}

                                    {/* Warnings / Labels */}
                                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                                        {payment.isDuplicateUtr && (
                                            <Badge className="bg-red-500 text-white border-none rounded-none font-black text-[9px] px-1.5 py-0.5">
                                                DUPLICATE UTR
                                            </Badge>
                                        )}
                                        <Badge className="bg-black/80 backdrop-blur text-white border-none rounded-none font-black text-[9px] px-1.5 py-0.5 flex items-center gap-1">
                                            <Tag className="w-2.5 h-2.5" />
                                            {payment.eventId.title}
                                        </Badge>
                                    </div>

                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Maximize2 className="w-5 h-5 text-white" />
                                    </div>
                                </div>

                                <CardContent className="p-3 flex-1 flex flex-col">
                                    {/* Attendee Info */}
                                    <div className="mb-3">
                                        <h3 className="text-sm font-black text-gray-900 leading-tight flex items-center gap-1.5 truncate">
                                            <UserIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            {payment.userId?.name || payment.guestName}
                                        </h3>
                                        <p className="text-[11px] text-gray-500 font-medium truncate ml-5">
                                            {payment.userId?.email || payment.guestEmail}
                                        </p>
                                    </div>

                                    {/* Key Data Grid */}
                                    <div className="grid grid-cols-2 gap-2 mb-3 bg-gray-50 p-2 border border-gray-100">
                                        <div>
                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Amount</span>
                                            <span className="text-sm font-black text-gray-900">₹{payment.pricePaid}</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">UTR / ID</span>
                                            <span className="text-[11px] font-black text-gray-900 font-mono truncate block">
                                                {payment.paymentProof.utr || 'EMPTY'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Compact Actions */}
                                    <div className="mt-auto space-y-1.5">
                                        <div className="flex gap-1.5">
                                            <Button
                                                className="flex-1 bg-[#00CC68] hover:bg-emerald-600 text-white rounded-none font-bold uppercase text-[10px] h-9"
                                                onClick={() => {
                                                    setSelectedPayment(payment);
                                                    setVerifyModalOpen(true);
                                                }}
                                            >
                                                Authorize
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="flex-1 border-gray-200 hover:bg-gray-50 text-gray-600 rounded-none font-bold uppercase text-[10px] h-9"
                                                onClick={() => {
                                                    setSelectedPayment(payment);
                                                    setRejectModalOpen(true);
                                                }}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            className="w-full bg-gray-900 hover:bg-black text-white rounded-none font-bold uppercase text-[9px] h-8 flex items-center justify-center gap-1.5"
                                            onClick={() => {
                                                setSelectedPayment(payment);
                                                setAutoVerifyModalOpen(true);
                                            }}
                                        >
                                            <Sparkles className="w-3 h-3" />
                                            Smart Verify
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Compact Pagination */}
                {totalPages > 1 && (
                    <div className="mt-12 flex items-center justify-center gap-4">
                        <Button
                            variant="outline"
                            className="w-10 h-10 rounded-none border-gray-200"
                            onClick={() => fetchPayments(page - 1)}
                            disabled={page <= 1 || loading}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-xs font-black text-gray-900 uppercase tracking-widest">
                            Page {page} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            className="w-10 h-10 rounded-none border-gray-200"
                            onClick={() => fetchPayments(page + 1)}
                            disabled={page >= totalPages || loading}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Modals */}

            <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
                <DialogContent className="max-w-[80vw] h-[80vh] p-0 border-none rounded-none bg-black overflow-hidden">
                    {selectedPayment && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center">
                            <img
                                src={`${baseUrl}${selectedPayment.paymentProof.screenshotUrl}`}
                                alt="Proof"
                                className="max-w-full max-h-full object-contain p-4"
                            />
                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end bg-black/60 backdrop-blur-md p-4 border-l-4 border-[#00CC68]">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-[#00CC68] uppercase tracking-widest">{selectedPayment.eventId.title}</p>
                                    <h3 className="text-xl font-black text-white">{selectedPayment.userId?.name || selectedPayment.guestName}</h3>
                                    <p className="text-xs text-white/60 font-mono">UTR: {selectedPayment.paymentProof.utr}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-white tracking-tighter">₹{selectedPayment.pricePaid}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={verifyModalOpen} onOpenChange={setVerifyModalOpen}>
                <DialogContent className="rounded-none border-2 border-gray-900 max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">Authorize Payment?</DialogTitle>
                    </DialogHeader>
                    {selectedPayment && (
                        <div className="space-y-3 mt-4">
                            {selectedPayment.isDuplicateUtr && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-3 flex gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                                    <div>
                                        <p className="text-xs font-black text-red-900 uppercase">Warning: Duplicate UTR</p>
                                        <p className="text-[10px] text-red-700">This UTR is already being used in another registration.</p>
                                    </div>
                                </div>
                            )}
                            <div className="bg-gray-50 p-4 border border-gray-100 text-sm">
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-400 font-bold text-[10px] uppercase">Attendee</span>
                                    <span className="font-black truncate">{selectedPayment.userId?.name || selectedPayment.guestName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400 font-bold text-[10px] uppercase">UTR Number</span>
                                    <span className="font-mono font-black">{selectedPayment.paymentProof.utr}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="mt-6 flex gap-2 sm:flex-row">
                        <Button variant="outline" className="rounded-none font-bold text-xs flex-1" onClick={() => setVerifyModalOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-[#00CC68] hover:bg-[#00b358] text-white rounded-none font-bold text-xs flex-1"
                            onClick={handleVerify}
                            disabled={actionLoading}
                        >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
                <DialogContent className="rounded-none border-2 border-red-500 max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-red-600">Reject Proof?</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        <Textarea
                            placeholder="Rejection reason..."
                            className="rounded-none border-gray-200 focus:border-red-500 text-sm"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter className="mt-6 flex gap-2 sm:flex-row">
                        <Button variant="outline" className="rounded-none font-bold text-xs flex-1" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            className="rounded-none font-bold text-xs flex-1"
                            onClick={handleReject}
                            disabled={actionLoading || !rejectionReason.trim()}
                        >
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={autoVerifyModalOpen} onOpenChange={setAutoVerifyModalOpen}>
                <DialogContent className="max-w-lg rounded-none border-2 border-gray-900">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[#00CC68]" />
                            Smart Verify
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        <Textarea
                            placeholder="Paste statement lines here..."
                            value={statementText}
                            onChange={(e) => setStatementText(e.target.value)}
                            rows={8}
                            className="font-mono text-[10px] rounded-none border-gray-200"
                        />
                    </div>
                    <DialogFooter className="mt-6">
                        <Button
                            className="bg-black hover:bg-gray-800 text-white rounded-none font-bold uppercase text-[10px] h-10 w-full"
                            onClick={handleAutoVerify}
                            disabled={actionLoading || !statementText.trim()}
                        >
                            Run Match
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
