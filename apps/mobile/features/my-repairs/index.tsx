import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Clock3, ScrollText, Wrench, X, XCircle } from 'lucide-react';
import { mockPassportById, mockRepairerById } from '@lumiris/mock-data';
import type { Passport, Repairer, RepairerSpecialty } from '@lumiris/types';
import {
    type RepairRequest,
    type RepairRequestStatus,
    updateRepairRequest,
    useRepairRequests,
} from '@/lib/repairs/storage';

const SPECIALITY_LABEL: Record<RepairerSpecialty, string> = {
    alteration: 'Retouche',
    embroidery: 'Broderie',
    'shoe-repair': 'Cordonnerie',
    leather: 'Cuir',
    lining: 'Doublure',
    'electronics-repair': 'Électronique',
    'phone-repair': 'Téléphonie',
    'computer-repair': 'Informatique',
    cabinetmaking: 'Ébénisterie',
    upholstery: 'Tapisserie',
    'appliance-repair': 'Électroménager',
};

const STATUS_LABEL: Record<RepairRequestStatus, string> = {
    pending: 'En attente',
    cancelled: 'Annulée',
    completed: 'Terminée',
};

const STATUS_ORDER: readonly RepairRequestStatus[] = ['pending', 'completed', 'cancelled'];

interface ResolvedRequest {
    request: RepairRequest;
    repairer: Repairer | undefined;
    passport: Passport | undefined;
}

export function MyRepairs() {
    const navigate = useNavigate();
    const requests = useRepairRequests();
    const [detail, setDetail] = useState<RepairRequest | null>(null);

    const grouped = useMemo(() => {
        const buckets: Record<RepairRequestStatus, ResolvedRequest[]> = {
            pending: [],
            cancelled: [],
            completed: [],
        };
        for (const request of [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
            buckets[request.status].push({
                request,
                repairer: mockRepairerById(request.repairerId),
                passport: request.passportId ? mockPassportById(request.passportId) : undefined,
            });
        }
        return buckets;
    }, [requests]);

    const total = requests.length;

    return (
        <div className="bg-background flex h-full flex-col overflow-y-auto pb-24">
            <motion.header
                className="flex items-center gap-3 px-4 pb-3 pt-12"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    aria-label="Retour"
                    className="border-border bg-card text-foreground inline-flex h-9 w-9 items-center justify-center rounded-full border"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="text-foreground text-base font-bold">Mes demandes</h1>
                    <p className="text-muted-foreground text-xs">
                        {total} demande{total > 1 ? 's' : ''}
                    </p>
                </div>
            </motion.header>

            {total === 0 ? <Empty /> : null}

            <div className="flex flex-col gap-5 px-4">
                {STATUS_ORDER.map((status) => {
                    const items = grouped[status];
                    if (items.length === 0) return null;
                    return (
                        <section key={status} className="flex flex-col gap-2">
                            <h2 className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                                {STATUS_LABEL[status]} ({items.length})
                            </h2>
                            <ul className="flex flex-col gap-2">
                                {items.map((entry) => (
                                    <li key={entry.request.id}>
                                        <RequestCard
                                            entry={entry}
                                            onView={() => setDetail(entry.request)}
                                            onCancel={() =>
                                                updateRepairRequest(entry.request.id, { status: 'cancelled' })
                                            }
                                        />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    );
                })}
            </div>

            <AnimatePresence>
                {detail ? (
                    <RequestDetailOverlay
                        request={detail}
                        repairer={mockRepairerById(detail.repairerId)}
                        passport={detail.passportId ? mockPassportById(detail.passportId) : undefined}
                        onClose={() => setDetail(null)}
                    />
                ) : null}
            </AnimatePresence>
        </div>
    );
}

function Empty() {
    return (
        <motion.div
            className="flex flex-1 flex-col items-center justify-center gap-4 px-8 pb-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="border-border/60 bg-card flex h-16 w-16 items-center justify-center rounded-3xl border">
                <Wrench className="text-muted-foreground h-7 w-7" />
            </div>
            <div>
                <h2 className="text-foreground text-base font-semibold">Aucune demande pour l&apos;instant</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Trouve un retoucheur près de chez toi et lance ta première retouche.
                </p>
            </div>
            <Link
                to="/local"
                className="bg-foreground text-primary-foreground inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
            >
                <Wrench className="h-4 w-4" />
                Voir les retoucheurs
            </Link>
        </motion.div>
    );
}

function StatusIcon({ status }: { status: RepairRequestStatus }) {
    if (status === 'completed') return <CheckCircle2 className="text-lumiris-emerald h-3.5 w-3.5" />;
    if (status === 'cancelled') return <XCircle className="text-muted-foreground h-3.5 w-3.5" />;
    return <Clock3 className="text-lumiris-cyan h-3.5 w-3.5" />;
}

function RequestCard({
    entry,
    onView,
    onCancel,
}: {
    entry: ResolvedRequest;
    onView: () => void;
    onCancel: () => void;
}) {
    const { request, repairer, passport } = entry;
    const repairerName = repairer?.atelierName ?? repairer?.displayName ?? 'Retoucheur supprimé';
    const reference = passport?.garment.reference ?? 'Pièce non précisée';
    const date = new Date(request.createdAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
    const canCancel = request.status === 'pending';

    return (
        <article className="border-border/60 bg-card flex flex-col gap-2 rounded-2xl border p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-foreground truncate text-sm font-semibold">{repairerName}</p>
                    <p className="text-muted-foreground truncate text-xs">{reference}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold">
                    <StatusIcon status={request.status} />
                    {STATUS_LABEL[request.status]}
                </span>
            </div>

            <div className="text-muted-foreground flex items-center justify-between text-[11px]">
                <span>
                    {SPECIALITY_LABEL[request.specialty]} · {date}
                </span>
                <span className="font-mono">#{request.id}</span>
            </div>

            <div className="mt-1 flex items-center justify-end gap-2">
                {canCancel ? (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="border-lumiris-rose/30 text-lumiris-rose inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-medium"
                    >
                        Annuler
                    </button>
                ) : null}
                <button
                    type="button"
                    onClick={onView}
                    className="border-border bg-card text-foreground inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-medium"
                >
                    <ScrollText className="h-3 w-3" />
                    Voir le détail
                </button>
            </div>
        </article>
    );
}

function RequestDetailOverlay({
    request,
    repairer,
    passport,
    onClose,
}: {
    request: RepairRequest;
    repairer: Repairer | undefined;
    passport: Passport | undefined;
    onClose: () => void;
}) {
    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="bg-background/70 absolute inset-0 backdrop-blur-sm" onClick={onClose} role="presentation" />
            <motion.div
                role="dialog"
                aria-label={`Détail demande ${request.id}`}
                className="border-border bg-card relative mx-4 mb-8 w-full max-w-sm rounded-3xl border p-5 shadow-2xl"
                initial={{ y: 60 }}
                animate={{ y: 0 }}
                exit={{ y: 60 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fermer"
                    className="border-border/60 bg-card text-foreground absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border"
                >
                    <X className="h-3.5 w-3.5" />
                </button>

                <h2 className="text-foreground text-base font-semibold">
                    {repairer?.atelierName ?? repairer?.displayName ?? 'Retoucheur'}
                </h2>
                <p className="text-muted-foreground text-xs">
                    {SPECIALITY_LABEL[request.specialty]}
                    {passport ? ` · ${passport.garment.reference}` : ''}
                </p>

                <p className="text-foreground mt-3 whitespace-pre-line text-sm leading-relaxed">
                    {request.description}
                </p>

                {request.photos.length > 0 ? (
                    <ul className="mt-3 flex flex-wrap gap-2">
                        {request.photos.map((src, idx) => (
                            <li key={`${idx}-${src.length}`} className="h-16 w-16">
                                <img
                                    src={src}
                                    alt={`Pièce jointe ${idx + 1}`}
                                    className="border-border h-full w-full rounded-lg border object-cover"
                                />
                            </li>
                        ))}
                    </ul>
                ) : null}

                <p className="text-muted-foreground/80 mt-4 text-[11px]">
                    Créée le{' '}
                    {new Date(request.createdAt).toLocaleString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </p>
            </motion.div>
        </motion.div>
    );
}
