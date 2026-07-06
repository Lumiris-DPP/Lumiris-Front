'use client';

import { useEffect } from 'react';

/**
 * Opens the browser print dialog once `ready` becomes true, after a short delay
 * to let the page paint. Shared by the `/print/*` routes.
 */
export function useAutoPrint(ready: boolean, delayMs = 300): void {
    useEffect(() => {
        if (!ready) return;
        const timer = window.setTimeout(() => window.print(), delayMs);
        return () => window.clearTimeout(timer);
    }, [ready, delayMs]);
}
