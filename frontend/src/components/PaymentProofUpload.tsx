import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, Loader2, Image as ImageIcon, AlertCircle, Scan } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Tesseract from 'tesseract.js';

interface PaymentProofUploadProps {
    ticketId: string;
    expectedAmount: number;
    onUploadSuccess?: () => void;
}

export function PaymentProofUpload({ ticketId, expectedAmount, onUploadSuccess }: PaymentProofUploadProps) {
    const { toast } = useToast();
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const [isProcessingOcr, setIsProcessingOcr] = useState(false);
    const [utr, setUtr] = useState('');
    const [amount, setAmount] = useState(expectedAmount.toString());
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [ocrResults, setOcrResults] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const performOcr = async (file: File) => {
        setIsProcessingOcr(true);
        try {
            const result = await Tesseract.recognize(file, 'eng');
            const text = result.data.text;
            setOcrResults({
                fullText: text,
                confidence: result.data.confidence,
                scannedAt: new Date().toISOString()
            });

            const utrMatches = text.match(/\b\d{12}\b/g);
            if (utrMatches && utrMatches.length > 0) {
                setUtr(utrMatches[0]);
                toast({
                    title: 'UTR Detected',
                    description: 'Transaction ID found and filled automatically.',
                });
            }

            const amountMatches = text.match(/(?:RS|INR|₹)\s*(\d+(?:\.\d{1,2})?)/i);
            if (amountMatches && amountMatches[1]) {
                const detectedAmount = amountMatches[1];
                if (parseFloat(detectedAmount) === expectedAmount) {
                    setAmount(detectedAmount);
                }
            }
        } catch (error) {
            console.error('OCR Error:', error);
        } finally {
            setIsProcessingOcr(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast({
                    title: 'File too large',
                    description: 'Please select a file smaller than 10MB',
                    variant: 'destructive'
                });
                return;
            }

            setScreenshot(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);

            if (file.type.startsWith('image/')) {
                performOcr(file);
            }
        }
    };

    const handleUpload = async () => {
        if (!screenshot) {
            toast({
                title: 'Screenshot required',
                description: 'Please select a payment screenshot',
                variant: 'destructive'
            });
            return;
        }

        if (!utr.trim()) {
            toast({
                title: 'UTR required',
                description: 'Please enter the UPI transaction reference number (UTR)',
                variant: 'destructive'
            });
            return;
        }

        setUploading(true);

        try {
            const token = localStorage.getItem('auth_token');
            const formData = new FormData();
            formData.append('screenshot', screenshot);
            formData.append('utr', utr.trim());
            formData.append('amount', amount);

            if (ocrResults) {
                formData.append('ocrData', JSON.stringify(ocrResults));
            }

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/payment-verification/tickets/${ticketId}/payment-proof`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData
                }
            );

            if (res.ok) {
                setUploaded(true);
                toast({
                    title: 'Success!',
                    description: 'Payment proof uploaded. Your ticket will be issued after verification.'
                });
                if (onUploadSuccess) onUploadSuccess();
            } else {
                const error = await res.json();
                toast({
                    title: 'Upload failed',
                    description: error.message || 'Failed to upload payment proof',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to upload payment proof. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setUploading(false);
        }
    };

    if (uploaded) {
        return (
            <Card className="border-none shadow-none bg-green-50 rounded-lg">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-green-900 mb-2">Payment Proof Uploaded!</h3>
                        <p className="text-green-700 text-sm">
                            Your payment is being verified. You'll receive your ticket once the organizer confirms the payment.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardContent className="p-0 space-y-6">
                {/* Screenshot Upload */}
                <div className="space-y-4">
                    <div
                        onClick={() => !isProcessingOcr && fileInputRef.current?.click()}
                        className={`rounded-lg p-10 text-center cursor-pointer transition-all relative overflow-hidden ${previewUrl ? 'bg-[#00CC68]/5' : 'bg-gray-50 hover:bg-gray-100'
                            } ${isProcessingOcr ? 'cursor-not-allowed' : ''}`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            id="screenshot"
                            accept="image/*,.pdf"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {isProcessingOcr && (
                            <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center animate-in fade-in">
                                <Loader2 className="w-8 h-8 text-[#00CC68] animate-spin mb-3" />
                                <p className="text-sm font-bold text-gray-900">Scanning screenshot...</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Automatic verification in progress</p>
                            </div>
                        )}

                        {previewUrl ? (
                            <div className="animate-in fade-in zoom-in-95">
                                <img src={previewUrl} alt="Payment Screenshot" className="max-h-64 mx-auto rounded-lg shadow-sm mb-4" />
                                <div className="flex items-center justify-center gap-2 text-[#00CC68]">
                                    <CheckCircle className="w-4 h-4" />
                                    <p className="text-sm font-bold text-gray-900">{screenshot?.name}</p>
                                </div>
                                <p className="text-xs text-gray-400 mt-2 font-medium">Click to change file</p>
                            </div>
                        ) : (
                            <div className="py-2">
                                <div className="w-12 h-12 bg-[#00CC68]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Upload className="w-6 h-6 text-[#00CC68]" />
                                </div>
                                <p className="text-sm font-bold text-gray-900">Click to upload screenshot</p>
                                <p className="text-xs text-gray-500 mt-1">Maximum file size 10MB</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* UTR Input */}
                    <div className="space-y-2">
                        <Label htmlFor="utr" className="text-xs font-black text-gray-900 uppercase tracking-widest">UPI Reference (UTR) *</Label>
                        <Input
                            id="utr"
                            placeholder="12 digit number"
                            value={utr}
                            onChange={(e) => setUtr(e.target.value)}
                            className="font-mono border-none bg-gray-50 h-12 rounded-lg focus-visible:ring-[#00CC68] px-4 text-base"
                        />
                    </div>

                    {/* Amount Confirmation */}
                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-xs font-black text-gray-900 uppercase tracking-widest">Amount Paid *</Label>
                        <Input
                            id="amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="font-bold border-none bg-gray-50 h-12 rounded-lg focus-visible:ring-[#00CC68] px-4 text-base"
                        />
                    </div>
                </div>

                {/* Important Note */}
                <div className="bg-gray-50 rounded-lg p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#00CC68]" />
                    <div className="flex gap-4">
                        <AlertCircle className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" />
                        <div className="space-y-3">
                            <p className="font-bold text-gray-900 text-sm uppercase tracking-tight">Submission Guidelines</p>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed font-semibold">
                                    <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                                    Screenshot must clearly show the UTR/Transaction ID
                                </li>
                                <li className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed font-semibold">
                                    <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                                    Payment amount and recipient details should be visible
                                </li>
                                <li className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed font-semibold">
                                    <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                                    Tickets are issued after manual host verification
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handleUpload}
                    disabled={uploading || isProcessingOcr || !screenshot || !utr.trim()}
                    className="w-full h-14 bg-[#00CC68] hover:bg-[#00b359] text-white text-lg font-bold rounded-lg shadow-lg shadow-[#00CC68]/10 transition-all hover:translate-y-[-1px] active:translate-y-0"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Upload className="w-5 h-5 mr-3" />
                            Submit Payment Proof
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
