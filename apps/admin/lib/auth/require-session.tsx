'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from './current-user';

export function RequireSession({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname() ?? '/';
    const session = useSession();

    useEffect(() => {
        if (!session) {
            const next = encodeURIComponent(pathname);
            router.replace(`/login?next=${next}`);
        }
    }, [session, pathname, router]);

    if (!session) return null;
    return <>{children}</>;
}
