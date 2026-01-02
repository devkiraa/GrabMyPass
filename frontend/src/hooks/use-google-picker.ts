'use client';

import { useCallback, useEffect, useState, useRef } from 'react';

interface PickerConfig {
    accessToken: string;
    developerKey?: string;
    clientId: string;
}

interface UseGooglePickerProps {
    onFilePicked: (fileId: string, fileName: string) => void;
    mimeTypes?: string[];
}

// Declare global Google Picker types
declare global {
    interface Window {
        google?: {
            picker: {
                PickerBuilder: new () => GooglePickerBuilder;
                ViewId: {
                    FORMS: string;
                    DOCS: string;
                    DOCUMENTS: string;
                };
                DocsView: new (viewId?: string) => GooglePickerView;
                Feature: {
                    MULTISELECT_ENABLED: string;
                };
                Action: {
                    PICKED: string;
                    CANCEL: string;
                };
            };
        };
        gapi?: {
            load: (api: string, callback: () => void) => void;
        };
    }
}

interface GooglePickerBuilder {
    addView: (view: GooglePickerView) => GooglePickerBuilder;
    setOAuthToken: (token: string) => GooglePickerBuilder;
    setDeveloperKey: (key: string) => GooglePickerBuilder;
    setCallback: (callback: (data: GooglePickerResponse) => void) => GooglePickerBuilder;
    setOrigin: (origin: string) => GooglePickerBuilder;
    setTitle: (title: string) => GooglePickerBuilder;
    enableFeature: (feature: string) => GooglePickerBuilder;
    setSize: (width: number, height: number) => GooglePickerBuilder;
    build: () => { setVisible: (visible: boolean) => void };
}

interface GooglePickerView {
    setMimeTypes: (types: string) => GooglePickerView;
    setQuery: (query: string) => GooglePickerView;
}

interface GooglePickerResponse {
    action: string;
    docs?: Array<{
        id: string;
        name: string;
        mimeType: string;
        url: string;
    }>;
}

// CSS to style the Google Picker properly
const PICKER_STYLES = `
    /* Google Picker overlay styling */
    .picker-dialog-bg {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.5) !important;
        z-index: 10000 !important;
    }
    
    .picker-dialog {
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        z-index: 10001 !important;
        max-width: 90vw !important;
        max-height: 90vh !important;
    }
    
    .picker-dialog-content {
        max-height: 80vh !important;
        overflow: auto !important;
    }
    
    /* Ensure body doesn't scroll when picker is open */
    body.picker-open {
        overflow: hidden !important;
        position: fixed !important;
        width: 100% !important;
        height: 100% !important;
    }
`;

export function useGooglePicker({ onFilePicked, mimeTypes }: UseGooglePickerProps) {
    const [pickerLoaded, setPickerLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pickerConfig, setPickerConfig] = useState<PickerConfig | null>(null);
    const styleRef = useRef<HTMLStyleElement | null>(null);
    const scrollPositionRef = useRef(0);

    // Inject picker styles on mount
    useEffect(() => {
        if (!styleRef.current) {
            const style = document.createElement('style');
            style.textContent = PICKER_STYLES;
            document.head.appendChild(style);
            styleRef.current = style;
        }

        return () => {
            if (styleRef.current) {
                styleRef.current.remove();
                styleRef.current = null;
            }
        };
    }, []);

    // Load Google Picker API script
    useEffect(() => {
        if (window.google?.picker) {
            setPickerLoaded(true);
            return;
        }

        // Load the Google API script
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            window.gapi?.load('picker', () => {
                setPickerLoaded(true);
            });
        };
        document.head.appendChild(script);

        return () => {
            // Cleanup if needed
        };
    }, []);

    // Lock body scroll
    const lockBodyScroll = useCallback(() => {
        scrollPositionRef.current = window.scrollY;
        document.body.classList.add('picker-open');
        document.body.style.top = `-${scrollPositionRef.current}px`;
    }, []);

    // Unlock body scroll
    const unlockBodyScroll = useCallback(() => {
        document.body.classList.remove('picker-open');
        document.body.style.top = '';
        window.scrollTo(0, scrollPositionRef.current);
    }, []);

    // Fetch picker token from backend
    const fetchPickerToken = useCallback(async (): Promise<PickerConfig | null> => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setError('Not authenticated');
            return null;
        }

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/google-forms/picker-token`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!res.ok) {
                const data = await res.json();
                if (data.needsReconnect) {
                    setError('Please reconnect your Google account');
                } else {
                    setError(data.message || 'Failed to get picker token');
                }
                return null;
            }

            const data = await res.json();
            return {
                accessToken: data.accessToken,
                developerKey: data.developerKey,
                clientId: data.clientId
            };
        } catch (err) {
            setError('Failed to initialize picker');
            return null;
        }
    }, []);

    // Open the Google Picker
    const openPicker = useCallback(async () => {
        if (!pickerLoaded) {
            setError('Picker not loaded yet');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Fetch fresh token each time
            const config = await fetchPickerToken();
            if (!config) {
                setLoading(false);
                return;
            }

            setPickerConfig(config);

            // Lock body scroll when picker opens
            lockBodyScroll();

            // Create the picker view for Google Forms
            const view = new window.google!.picker.DocsView();

            // Filter to only show Google Forms
            if (mimeTypes && mimeTypes.length > 0) {
                view.setMimeTypes(mimeTypes.join(','));
            } else {
                // Default to Google Forms
                view.setMimeTypes('application/vnd.google-apps.form');
            }

            // Build the picker
            const pickerBuilder = new window.google!.picker.PickerBuilder()
                .addView(view)
                .setOAuthToken(config.accessToken)
                .setTitle('Select a Google Form')
                .setOrigin(window.location.origin)
                .setCallback((data: GooglePickerResponse) => {
                    // Unlock scroll when picker closes
                    unlockBodyScroll();

                    if (data.action === window.google!.picker.Action.PICKED) {
                        const doc = data.docs?.[0];
                        if (doc) {
                            onFilePicked(doc.id, doc.name);
                        }
                    }
                    setLoading(false);
                });

            // Add developer key if available (enables higher quotas)
            if (config.developerKey) {
                pickerBuilder.setDeveloperKey(config.developerKey);
            }

            // Set picker size for better display
            pickerBuilder.setSize(800, 550);

            const picker = pickerBuilder.build();
            picker.setVisible(true);
        } catch (err) {
            console.error('Failed to open picker:', err);
            setError('Failed to open file picker');
            unlockBodyScroll();
            setLoading(false);
        }
    }, [pickerLoaded, fetchPickerToken, onFilePicked, mimeTypes, lockBodyScroll, unlockBodyScroll]);

    return {
        openPicker,
        loading,
        error,
        pickerLoaded,
        clearError: () => setError(null)
    };
}
