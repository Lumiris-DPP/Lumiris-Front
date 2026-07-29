'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ExternalLink, FileText } from 'lucide-react';
import { getEffectiveStatus } from '@lumiris/types';
import { mockPassports } from '@lumiris/mock-data';
import { AtelierStatusBadge } from '@lumiris/scoring-ui';
import { formatDateFr } from '@lumiris/utils';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { DetailDrawer } from '@lumiris/ui/components/detail-drawer';
import type { ArtisanCertificate } from '@/lib/certificates-store';
import { useDraftStore, draftToPassport } from '@/lib/draft-store';
import { certLabel } from './certification-status';

interface Props {
    cert: ArtisanCertificate | null;
    onClose: () => void;
}

export function CertificationDetailDrawer({ cert, onClose }: Props) {
    if (!cert) {
        return <DetailDrawer open={false} onOpenChange={onClose} title="" />;
    }
    return <DrawerBody cert={cert} onClose={onClose} />;
}

function DrawerBody({ cert, onClose }: { cert: ArtisanCertificate; onClose: () => void }) {
    const linked = useLinkedPassports(cert);
    const status = getEffectiveStatus(cert, new Date());

    return (
        <DetailDrawer
            open
            onOpenChange={(o) => !o && onClose()}
            title={certLabel(cert)}
            subtitle={cert.issuer}
            width="md"
            tabs={[
                { value: 'detail', label: 'Détail', content: <DetailTab cert={cert} status={status} /> },
                {
                    value: 'passports',
                    label: `Passeports (${linked.length})`,
                    content: <LinkedPassportsTab linked={linked} />,
                },
            ]}
        />
    );
}

function DetailTab({ cert, status }: { cert: ArtisanCertificate; status: string }) {
    const fileUrl = cert.fileDataUri || cert.fileUrl;
    const rows = [
        { label: 'Type', value: certLabel(cert) },
        { label: 'Émetteur', value: cert.issuer },
        { label: 'Portée', value: cert.scope ?? '—' },
        { label: 'Émise le', value: formatDateFr(cert.issuedAt) },
        { label: 'Expire le', value: formatDateFr(cert.expiresAt) },
    ];
    return (
        <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
                {rows.map((row) => (
                    <div key={row.label} className="flex flex-col gap-0.5">
                        <span className="text-[10px] tracking-wider text-muted-foreground uppercase">{row.label}</span>
                        <span className="text-foreground">{row.value}</span>
                    </div>
                ))}
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] tracking-wider text-muted-foreground uppercase">Statut</span>
                    <span>
                        <AtelierStatusBadge status={status} />
                    </span>
                </div>
            </div>
            <DocumentPreview src={fileUrl} title={certLabel(cert)} />
        </div>
    );
}

function DocumentPreview({ src, title }: { src: string | undefined; title: string }) {
    if (!src) {
        return (
            <p className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                Aucun document attaché.
            </p>
        );
    }
    const isImage = src.startsWith('data:image') || /\.(png|jpe?g|webp|gif|avif)$/i.test(src);
    return (
        <div className="rounded-lg border border-border bg-muted/40 p-3">
            {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={`Document ${title}`} className="max-h-60 w-full rounded-md object-contain" />
            ) : (
                <div className="flex items-center gap-3">
                    <FileText className="h-7 w-7 shrink-0 text-muted-foreground" />
                    <Button asChild variant="outline" size="sm">
                        <a href={src} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Ouvrir le PDF
                        </a>
                    </Button>
                </div>
            )}
        </div>
    );
}

function LinkedPassportsTab({ linked }: { linked: ReadonlyArray<{ id: string; reference: string; status: string }> }) {
    if (linked.length === 0) {
        return <p className="text-sm text-muted-foreground">Aucun passeport n’utilise cette certification.</p>;
    }
    return (
        <div className="space-y-2">
            {linked.map((p) => (
                <Link
                    key={p.id}
                    href={`/passports/${p.id}`}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/40"
                >
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{p.reference}</p>
                        <p className="font-mono text-xs text-muted-foreground">{p.id}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                        {p.status}
                    </Badge>
                </Link>
            ))}
        </div>
    );
}

function useLinkedPassports(cert: ArtisanCertificate) {
    const drafts = useDraftStore((s) => s.drafts);
    return useMemo(() => {
        const locals = Object.values(drafts)
            .filter((d) => d.artisanId === cert.artisanId)
            .map(draftToPassport);
        const fixed = mockPassports.filter((p) => p.artisanId === cert.artisanId);
        return [...locals, ...fixed]
            .filter((p) => p.certifications.some((c) => c.id === cert.id))
            .map((p) => ({ id: p.id, reference: p.garment.reference || p.id, status: String(p.status) }));
    }, [drafts, cert.artisanId, cert.id]);
}
