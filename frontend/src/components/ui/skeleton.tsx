import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-slate-200",
                className
            )}
        />
    );
}

// Pre-built skeleton components for common patterns
export function SkeletonCard() {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
            </div>
        </div>
    );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16 ml-auto" />
            </div>
            {/* Rows */}
            {Array(rows).fill(0).map((_, i) => (
                <div key={i} className="px-6 py-4 border-b border-slate-50 flex gap-4 items-center">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-16 ml-auto rounded-full" />
                </div>
            ))}
        </div>
    );
}

export function SkeletonStats() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-xl" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonEventCard() {
    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">
            <Skeleton className="h-40 w-full rounded-none" />
            <div className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 w-full" />
                </div>
            </div>
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Stats */}
            <SkeletonStats />

            {/* Content */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-9 w-24" />
                </div>
                <SkeletonTable rows={5} />
            </div>
        </div>
    );
}
