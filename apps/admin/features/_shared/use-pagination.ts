'use client';

import { useEffect, useMemo, useState } from 'react';

interface PaginationState<T> {
    page: number;
    pageSize: number;
    pageCount: number;
    pageItems: readonly T[];
    rangeStart: number;
    rangeEnd: number;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
}

export function usePagination<T>(items: readonly T[], initialPageSize: number): PaginationState<T> {
    const [page, setPageRaw] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);

    const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

    useEffect(() => {
        if (page > pageCount) setPageRaw(1);
    }, [page, pageCount]);

    const pageItems = useMemo(() => {
        const start = (page - 1) * pageSize;
        return items.slice(start, start + pageSize);
    }, [items, page, pageSize]);

    const rangeStart = items.length === 0 ? 0 : (page - 1) * pageSize + 1;
    const rangeEnd = Math.min(page * pageSize, items.length);

    const setPage = (next: number) => setPageRaw(Math.max(1, Math.min(pageCount, next)));

    return { page, pageSize, pageCount, pageItems, rangeStart, rangeEnd, setPage, setPageSize };
}
