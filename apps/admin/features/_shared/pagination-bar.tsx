'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';

interface PaginationBarProps {
    page: number;
    pageCount: number;
    pageSize: number;
    rangeStart: number;
    rangeEnd: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: readonly number[];
    label?: string;
}

export function PaginationBar({
    page,
    pageCount,
    pageSize,
    rangeStart,
    rangeEnd,
    totalCount,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions,
    label = 'entrées',
}: PaginationBarProps) {
    return (
        <div className="border-border bg-card flex items-center justify-between gap-3 border-t px-4 py-2">
            <p className="text-muted-foreground text-xs">
                {totalCount === 0 ? `0 / 0 ${label}` : `${rangeStart}-${rangeEnd} / ${totalCount} ${label}`}
            </p>
            <div className="flex items-center gap-2">
                {onPageSizeChange && pageSizeOptions ? (
                    <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
                        <SelectTrigger className="h-7 w-24 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {pageSizeOptions.map((opt) => (
                                <SelectItem key={opt} value={String(opt)}>
                                    {opt} / page
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : null}
                <div className="flex items-center gap-1">
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                        aria-label="Page précédente"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                    <span className="text-muted-foreground min-w-[64px] text-center font-mono text-xs">
                        {page} / {pageCount}
                    </span>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= pageCount}
                        aria-label="Page suivante"
                    >
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                </div>
            </div>
        </div>
    );
}
