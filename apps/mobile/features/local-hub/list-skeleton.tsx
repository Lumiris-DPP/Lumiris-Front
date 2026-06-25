import { Skeleton } from '@lumiris/ui/components/skeleton';

interface ListSkeletonProps {
    count?: number;
}

export function ListSkeleton({ count = 5 }: ListSkeletonProps) {
    return (
        <ul className="flex flex-col gap-4" aria-hidden>
            {Array.from({ length: count }, (_, i) => (
                <li key={i} className="bg-card border-border/60 opal-shadow flex gap-3 rounded-2xl border p-3.5">
                    <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
                    <div className="flex flex-1 flex-col gap-2 py-1">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                        <div className="flex gap-1.5">
                            <Skeleton className="h-4 w-14 rounded-full" />
                            <Skeleton className="h-4 w-12 rounded-full" />
                        </div>
                        <Skeleton className="mt-0.5 h-3 w-1/2" />
                    </div>
                </li>
            ))}
        </ul>
    );
}
