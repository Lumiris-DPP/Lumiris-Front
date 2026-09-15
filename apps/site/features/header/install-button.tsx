import Link from 'next/link';
import { Download } from 'lucide-react';
import { cn } from '@lumiris/ui/lib/cn';

export function InstallButton({ className }: { className?: string }) {
    return (
        <Link
            href="/telecharger"
            className={cn(
                'inline-flex items-center gap-2 rounded-lg bg-foreground px-3.5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90',
                className,
            )}
        >
            <Download className="h-4 w-4" aria-hidden />
            Installer l&apos;app
        </Link>
    );
}
