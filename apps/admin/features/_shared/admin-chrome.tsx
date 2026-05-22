import type { ReactNode } from 'react';
import { RequireSession } from '@/lib/auth';
import { NonNegotiableBanner } from './non-negotiable-banner';

const GLOBAL_RULE = 'Console lecture-seule · audit irréversible · score jamais payable';

export function AdminChrome({ children }: { children: ReactNode }) {
    return (
        <RequireSession>
            <div className="mb-6">
                <NonNegotiableBanner rule={GLOBAL_RULE} />
            </div>
            {children}
        </RequireSession>
    );
}
