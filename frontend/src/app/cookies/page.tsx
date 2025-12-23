'use client';

import StaticPageLayout from '@/components/StaticPageLayout';
import { Button } from '@/components/ui/button';
import { Cookie, Shield, BarChart3, Palette, Target, Check, X } from 'lucide-react';
import { useState } from 'react';

export default function CookiesPage() {
    const [preferences, setPreferences] = useState({
        essential: true,
        analytics: true,
        functional: true,
        marketing: false
    });
    const [saved, setSaved] = useState(false);

    const cookieTypes = [
        {
            id: 'essential',
            icon: Shield,
            title: 'Essential Cookies',
            description: 'Required for the website to function properly. These cannot be disabled.',
            examples: ['Authentication', 'Security', 'Load balancing'],
            required: true,
            color: 'green'
        },
        {
            id: 'analytics',
            icon: BarChart3,
            title: 'Analytics Cookies',
            description: 'Help us understand how visitors use our website so we can improve it.',
            examples: ['Page views', 'Feature usage', 'Error tracking'],
            required: false,
            color: 'blue'
        },
        {
            id: 'functional',
            icon: Palette,
            title: 'Functional Cookies',
            description: 'Remember your preferences for a better, personalized experience.',
            examples: ['Theme settings', 'Language', 'Recently viewed'],
            required: false,
            color: 'purple'
        },
        {
            id: 'marketing',
            icon: Target,
            title: 'Marketing Cookies',
            description: 'Used to deliver relevant advertisements based on your interests.',
            examples: ['Ad targeting', 'Retargeting', 'Conversion tracking'],
            required: false,
            color: 'amber'
        }
    ];

    const colorClasses: Record<string, string> = {
        green: 'bg-green-100 text-green-600 border-green-200',
        blue: 'bg-blue-100 text-blue-600 border-blue-200',
        purple: 'bg-purple-100 text-purple-600 border-purple-200',
        amber: 'bg-amber-100 text-amber-600 border-amber-200'
    };

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <StaticPageLayout
            title="Cookie Policy"
            subtitle="We use cookies to enhance your experience. Here's how."
        >
            <div className="max-w-4xl">
                {/* Hero Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 mb-12 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                        <Cookie className="w-8 h-8 text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 mb-1">What are cookies?</h2>
                        <p className="text-slate-600">
                            Cookies are small text files stored on your device that help us remember your preferences
                            and understand how you use our platform.
                        </p>
                    </div>
                </div>

                {/* Cookie Types */}
                <div className="space-y-4 mb-12">
                    {cookieTypes.map((cookie) => {
                        const Icon = cookie.icon;
                        const isEnabled = preferences[cookie.id as keyof typeof preferences];

                        return (
                            <div
                                key={cookie.id}
                                className={`p-6 rounded-2xl border-2 transition-all ${isEnabled ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl ${colorClasses[cookie.color]} border flex items-center justify-center shrink-0`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-semibold text-slate-900">{cookie.title}</h3>
                                                {cookie.required && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">Required</span>
                                                )}
                                            </div>
                                            <p className="text-slate-600 mb-3">{cookie.description}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {cookie.examples.map((example, i) => (
                                                    <span key={i} className="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-600">
                                                        {example}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => !cookie.required && setPreferences(prev => ({ ...prev, [cookie.id]: !prev[cookie.id as keyof typeof prev] }))}
                                        disabled={cookie.required}
                                        className={`w-14 h-8 rounded-full p-1 transition-colors ${cookie.required
                                                ? 'bg-green-500 cursor-not-allowed'
                                                : isEnabled
                                                    ? 'bg-indigo-600'
                                                    : 'bg-slate-300'
                                            }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0'
                                            }`}>
                                            {isEnabled ? (
                                                <Check className="w-6 h-6 p-1 text-green-500" />
                                            ) : (
                                                <X className="w-6 h-6 p-1 text-slate-400" />
                                            )}
                                        </div>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-900 mb-12">
                    <div className="text-white">
                        <h3 className="font-semibold mb-1">Save your preferences</h3>
                        <p className="text-sm text-slate-400">Your choices will be stored for 12 months</p>
                    </div>
                    <Button
                        onClick={handleSave}
                        className={`rounded-full px-6 transition-all ${saved ? 'bg-green-500 hover:bg-green-500' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                    >
                        {saved ? (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Saved!
                            </>
                        ) : (
                            'Save Preferences'
                        )}
                    </Button>
                </div>

                {/* Third Party Notice */}
                <div className="p-6 rounded-2xl border border-slate-200 bg-white">
                    <h3 className="font-semibold text-slate-900 mb-4">Third-Party Cookies</h3>
                    <p className="text-slate-600 mb-4">Some cookies are set by third-party services we use:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { name: 'Google Analytics', purpose: 'Usage analytics' },
                            { name: 'Stripe', purpose: 'Payment processing' },
                            { name: 'Intercom', purpose: 'Customer support' }
                        ].map((service, i) => (
                            <div key={i} className="p-3 rounded-xl bg-slate-50 text-center">
                                <div className="font-medium text-slate-900">{service.name}</div>
                                <div className="text-xs text-slate-500">{service.purpose}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </StaticPageLayout>
    );
}
