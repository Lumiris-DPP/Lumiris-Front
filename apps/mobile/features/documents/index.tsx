'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, ExternalLink, FileText } from 'lucide-react';
import { mockPassportById } from '@lumiris/mock-data';
import { cn } from '@lumiris/ui/lib/cn';
import {
    type DocumentKind,
    type WardrobeDocument,
    type WardrobeItem,
    DOCUMENT_KINDS,
    itemKey,
    useWardrobe,
} from '@/lib/wardrobe-storage';
import { routes } from '@/lib/routes';
import { decryptToBlob } from '@/lib/documents/crypto';
import { useUser } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { DOCUMENT_KIND_ICON, DOCUMENT_KIND_LABEL, humanSize } from '@/features/passport-detail/documents-sheet';

type Filter = 'all' | DocumentKind;

interface FlatDocument {
    doc: WardrobeDocument;
    item: WardrobeItem;
    label: string;
    href: string | null;
}

function deriveLabelAndHref(item: WardrobeItem): { label: string; href: string | null } {
    if (item.kind === 'lumiris-passport') {
        const passport = mockPassportById(item.passportId);
        return {
            label: passport?.garment.reference ?? 'Passeport Lumiris',
            href: `/passeport/${item.passportId}`,
        };
    }
    if (item.kind === 'manual') {
        return { label: item.productName, href: '/vault' };
    }
    if (item.kind === 'public-dpp') {
        return { label: item.productName, href: routes.publicPassport(item.publicCode) };
    }
    return { label: `DPP externe · ${item.gtin}`, href: '/vault' };
}

export function MyDocuments() {
    const router = useRouter();
    const wardrobe = useWardrobe();
    const { user } = useUser();
    const userId = user?.id ?? null;
    const [filter, setFilter] = useState<Filter>('all');

    const all = useMemo<FlatDocument[]>(() => {
        const rows: FlatDocument[] = [];
        for (const item of wardrobe) {
            const { label, href } = deriveLabelAndHref(item);
            for (const doc of item.documents) {
                rows.push({ doc, item, label, href });
            }
        }
        rows.sort((a, b) => b.doc.addedAt.localeCompare(a.doc.addedAt));
        return rows;
    }, [wardrobe]);

    const counts = useMemo(() => {
        const map = new Map<DocumentKind, number>();
        for (const row of all) {
            map.set(row.doc.kind, (map.get(row.doc.kind) ?? 0) + 1);
        }
        return map;
    }, [all]);

    const filtered = filter === 'all' ? all : all.filter((row) => row.doc.kind === filter);

    const onOpen = useCallback(
        async (doc: WardrobeDocument) => {
            try {
                const blob = await decryptToBlob(doc, userId);
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank', 'noopener,noreferrer');
                window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
            } catch {
                toast.error('Impossible de déchiffrer ce document');
            }
        },
        [userId],
    );

    const total = all.length;

    return (
        <div className="flex h-full flex-col overflow-y-auto bg-background pb-24">
            <motion.header
                className="flex items-center gap-3 px-4 pt-12 pb-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button
                    type="button"
                    onClick={() => router.back()}
                    aria-label="Retour"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="text-base font-bold text-foreground">Mes documents</h1>
                    <p className="text-xs text-muted-foreground">
                        {total} document{total > 1 ? 's' : ''} chiffré{total > 1 ? 's' : ''}
                    </p>
                </div>
            </motion.header>

            <KindFilter filter={filter} counts={counts} total={total} onChange={setFilter} />

            {filtered.length === 0 ? (
                <Empty hasAny={total > 0} />
            ) : (
                <ul className="flex flex-col gap-2 px-4 pt-3">
                    {filtered.map((row) => (
                        <li key={row.doc.id}>
                            <DocumentCard row={row} onOpen={() => onOpen(row.doc)} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

interface KindFilterProps {
    filter: Filter;
    counts: Map<DocumentKind, number>;
    total: number;
    onChange: (next: Filter) => void;
}

interface FilterChip {
    key: Filter;
    label: string;
    count: number;
}

function KindFilter({ filter, counts, total, onChange }: KindFilterProps) {
    const all: FilterChip = { key: 'all', label: 'Tous', count: total };
    const kindChips: FilterChip[] = DOCUMENT_KINDS.map((kind) => ({
        key: kind,
        label: DOCUMENT_KIND_LABEL[kind],
        count: counts.get(kind) ?? 0,
    }));
    const chips: FilterChip[] = [all, ...kindChips].filter((chip) => chip.key === 'all' || chip.count > 0);

    if (chips.length <= 1) return null;

    return (
        <div className="sticky top-0 z-10 mx-0 bg-background/85 px-4 py-2 backdrop-blur-md">
            <div
                role="tablist"
                aria-label="Filtrer par type de document"
                className="flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
                {chips.map((chip) => {
                    const active = chip.key === filter;
                    return (
                        <button
                            key={chip.key}
                            role="tab"
                            aria-selected={active}
                            type="button"
                            onClick={() => onChange(chip.key)}
                            className={cn(
                                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none',
                                active
                                    ? 'border-transparent bg-foreground text-background shadow-sm'
                                    : 'border-border/60 bg-card/40 text-muted-foreground hover:bg-card/70 hover:text-foreground',
                            )}
                        >
                            {chip.label}
                            <span className={cn('text-[10px]', active ? 'opacity-70' : 'opacity-60')}>
                                {chip.count}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function Empty({ hasAny }: { hasAny: boolean }) {
    return (
        <motion.div
            className="flex flex-1 flex-col items-center justify-center gap-3 px-8 pb-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-border/60 bg-card">
                <FileText className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
                <h2 className="text-base font-semibold text-foreground">
                    {hasAny ? 'Aucun document pour ce filtre' : 'Aucun document pour l’instant'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {hasAny
                        ? 'Change de catégorie ou ajoute des documents depuis un passeport.'
                        : 'Ouvre un passeport et utilise « Documents » pour joindre tes factures, garanties ou tickets.'}
                </p>
            </div>
        </motion.div>
    );
}

function DocumentCard({ row, onOpen }: { row: FlatDocument; onOpen: () => void }) {
    const Icon = DOCUMENT_KIND_ICON[row.doc.kind];
    const date = new Date(row.doc.addedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    return (
        <article className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-3">
            <div className="flex items-center gap-3">
                <span
                    aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                >
                    <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{row.doc.fileName}</p>
                    <p className="text-[11px] text-muted-foreground">
                        {DOCUMENT_KIND_LABEL[row.doc.kind]} · {humanSize(row.doc.byteLength)} · {date}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onOpen}
                    aria-label={`Ouvrir ${row.doc.fileName}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-card"
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                </button>
            </div>

            {row.href ? (
                <Link
                    href={row.href}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-[11px] text-muted-foreground hover:text-foreground"
                >
                    <span className="truncate">Rattaché à {row.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                </Link>
            ) : (
                <p className="truncate rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-[11px] text-muted-foreground">
                    Rattaché à {row.label}
                </p>
            )}

            <p className="truncate font-mono text-[10px] text-muted-foreground/70">#{itemKey(row.item)}</p>
        </article>
    );
}
