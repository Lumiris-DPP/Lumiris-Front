import Link from 'next/link';
import { LumirisLogo } from '@lumiris/ui/components/logo';

interface PrintMessageProps {
    title: string;
    description?: string;
    back?: { href: string; label: string };
}

export function PrintMessage({ title, description, back }: PrintMessageProps) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-white p-12 text-neutral-900">
            <div className="flex max-w-sm flex-col items-center gap-3 text-center">
                <LumirisLogo title="" className="h-6 w-auto" />
                <p className="text-base font-semibold">{title}</p>
                {description ? <p className="text-sm text-neutral-600">{description}</p> : null}
                {back ? (
                    <Link
                        href={back.href}
                        className="mt-2 text-sm font-semibold text-neutral-900 underline underline-offset-4 print:hidden"
                    >
                        {back.label}
                    </Link>
                ) : null}
            </div>
        </div>
    );
}
