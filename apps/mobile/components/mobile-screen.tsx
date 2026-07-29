import type { ReactNode } from 'react';

export function MobileScreen({ children }: { children?: ReactNode }) {
    return <div className="mx-auto flex h-dvh max-w-md flex-col bg-background">{children}</div>;
}
