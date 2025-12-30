'use client';

import StaticPageLayout from '@/components/StaticPageLayout';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function PricingPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('auth_token');
        setIsLoggedIn(!!token);
    }, []);

    const plans = [
        {
            id: 'free',
            name: 'Free',
            price: '₹0',
            period: 'forever',
            description: 'Perfect for trying out MakeTicket.',
            features: [
                '50 attendees per event',
                '2 events per month',
                '1 team member',
                'QR code tickets',
                'Email confirmations',
                'Basic analytics'
            ],
            cta: 'Get Started',
            popular: false
        },
        {
            id: 'starter',
            name: 'Starter',
            price: '₹49',
            period: '/month',
            description: 'Great for small events and workshops.',
            features: [
                '200 attendees per event',
                '5 events per month',
                '2 team members',
                'Custom branding',
                'Priority email delivery',
                'Standard support'
            ],
            cta: 'Start 7-day Trial',
            ctaLoggedIn: 'Upgrade Now',
            popular: false
        },
        {
            id: 'pro',
            name: 'Pro',
            price: '₹499',
            period: '/month',
            description: 'For growing organizers and businesses.',
            features: [
                '1,000 attendees per event',
                'Unlimited events',
                '10 team members',
                'Advanced analytics',
                'Custom email templates',
                'Priority support',
                'Export attendee data'
            ],
            cta: 'Start 7-day Trial',
            ctaLoggedIn: 'Upgrade Now',
            popular: true
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            price: 'Custom',
            period: '',
            description: 'For large organizations with custom needs.',
            features: [
                'Unlimited attendees',
                'Unlimited events',
                'Unlimited team members',
                'API access',
                'White-label solution',
                'SLA guarantee',
                'Dedicated support',
                'Custom integrations'
            ],
            cta: 'Contact Sales',
            popular: false
        }
    ];

    const getButtonLink = (plan: typeof plans[0]) => {
        if (plan.id === 'enterprise') {
            return '/contact?subject=Enterprise%20Plan';
        }
        if (isLoggedIn) {
            return '/dashboard/billing';
        }
        return '/register';
    };

    const getButtonText = (plan: typeof plans[0]) => {
        if (isLoggedIn && (plan.id === 'pro' || plan.id === 'starter')) {
            return plan.ctaLoggedIn || plan.cta;
        }
        return plan.cta;
    };

    return (
        <StaticPageLayout
            title="Pricing"
            subtitle="Simple, transparent pricing. No hidden fees."
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                {plans.map((plan, i) => (
                    <div
                        key={i}
                        className={`rounded-2xl border p-6 ${plan.popular
                            ? 'border-indigo-200 bg-indigo-50/50 ring-2 ring-indigo-600 relative'
                            : 'border-slate-200 bg-white'
                            }`}
                    >
                        {plan.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                Most Popular
                            </div>
                        )}
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                            <span className="text-slate-500 text-sm">{plan.period}</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">{plan.description}</p>
                        <Link href={getButtonLink(plan)}>
                            <Button className={`w-full rounded-full mb-4 text-sm ${plan.popular
                                ? 'bg-indigo-600 hover:bg-indigo-700'
                                : plan.id === 'starter' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'
                                }`}>
                                {getButtonText(plan)}
                            </Button>
                        </Link>
                        <ul className="space-y-2">
                            {plan.features.map((feature, j) => (
                                <li key={j} className="flex items-start gap-2 text-xs text-slate-600">
                                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Trust badges */}
            <div className="mt-16 text-center">
                <p className="text-sm text-slate-500 mb-4">Secure payments powered by</p>
                <div className="flex items-center justify-center gap-8">
                    <div className="flex items-center gap-2 text-slate-600">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <span className="text-sm font-medium">PCI-DSS Compliant</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                        </svg>
                        <span className="text-sm font-medium">256-bit SSL</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                        <img src="https://cdn.razorpay.com/static/assets/logo/payment.svg" alt="Razorpay" className="h-6" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        <span className="text-sm font-medium">Razorpay</span>
                    </div>
                </div>
            </div>
        </StaticPageLayout>
    );
}
