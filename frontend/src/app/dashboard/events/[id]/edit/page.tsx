'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function EditEventPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params?.id as string;

    useEffect(() => {
        // Redirect to create page with the event ID as draftId for editing
        if (eventId) {
            router.replace(`/dashboard/events/create?draftId=${eventId}`);
        }
    }, [eventId, router]);

    return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="ml-3 text-slate-500">Loading event editor...</span>
        </div>
    );
}
