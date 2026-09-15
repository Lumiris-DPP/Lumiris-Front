'use client';

import { Suspense, type ReactNode } from 'react';
import { useSearchParams, type ReadonlyURLSearchParams } from 'next/navigation';

interface SearchParamsBoundaryProps {
    children: (searchParams: ReadonlyURLSearchParams) => ReactNode;
}

export function SearchParamsBoundary({ children }: SearchParamsBoundaryProps) {
    return (
        <Suspense fallback={null}>
            <SearchParamsReader>{children}</SearchParamsReader>
        </Suspense>
    );
}

function SearchParamsReader({ children }: SearchParamsBoundaryProps) {
    return children(useSearchParams());
}
