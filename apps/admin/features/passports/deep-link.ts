'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function usePassportDeepLink() {
    const params = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const selectedId = params.get('id');

    const setSelectedId = useCallback(
        (id: string | null) => {
            const next = new URLSearchParams(params.toString());
            if (id) next.set('id', id);
            else next.delete('id');
            const qs = next.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        },
        [params, pathname, router],
    );

    return { selectedId, setSelectedId } as const;
}
