'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface UpiQrCodeProps {
    upiId: string;
    payeeName: string;
    amount: number;
    transactionNote?: string;
    className?: string;
    size?: number;
    hideDetails?: boolean;
    transparent?: boolean;
}

export function UpiQrCode({
    upiId,
    payeeName,
    amount,
    transactionNote,
    className,
    size = 300,
    hideDetails = false,
    transparent = false
}: UpiQrCodeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [upiString, setUpiString] = useState('');

    useEffect(() => {
        // Generate UPI payment string
        // Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&tn=NOTE
        const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}${transactionNote ? `&tn=${encodeURIComponent(transactionNote)}` : ''}`;

        setUpiString(upiUrl);

        // Generate QR Code
        if (canvasRef.current) {
            QRCode.toCanvas(canvasRef.current, upiUrl, {
                width: size,
                margin: 0,
                color: {
                    dark: '#000000',
                    light: transparent ? '#00000000' : '#FFFFFF'
                }
            });
        }
    }, [upiId, payeeName, amount, transactionNote, size, transparent]);

    return (
        <div className={className}>
            <div className={`${transparent ? 'bg-transparent' : 'bg-white'} ${hideDetails ? 'p-0' : 'p-6'} rounded-lg ${hideDetails || transparent ? '' : 'border-2 border-slate-200'} inline-block`}>
                <canvas ref={canvasRef} className="mx-auto block" />
                {!hideDetails && (
                    <div className="mt-4 text-center space-y-1">
                        <p className="text-sm font-semibold text-slate-900">Pay to: {payeeName}</p>
                        <p className="text-xs text-slate-600 font-mono">{upiId}</p>
                        <p className="text-lg font-bold text-green-600">₹{amount}</p>
                    </div>
                )}
            </div>
            {!hideDetails && (
                <p className="text-xs text-slate-500 mt-3 text-center max-w-sm">
                    Scan this QR code with any UPI app (Google Pay, PhonePe, Paytm, etc.) to make the payment
                </p>
            )}
        </div>
    );
}
