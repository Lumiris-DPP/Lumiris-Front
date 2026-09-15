'use client';

import { useMemo, useState, type SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, X } from 'lucide-react';
import { isApiError, useCreateRepairRequest } from '@lumiris/api-client/react';
import type { PublicRepairerDto } from '@/lib/public-repairer-api';
import { useUser } from '@/lib/auth';
import { useWardrobe, type PublicDppItem } from '@/lib/wardrobe-storage';

const MAX_MESSAGE = 500;

interface RepairRequestFormProps {
    repairer: PublicRepairerDto;
    prefillPublicCode: string | null;
}

export function RepairRequestForm({ repairer, prefillPublicCode }: RepairRequestFormProps) {
    const router = useRouter();
    const { isAuthenticated } = useUser();
    const wardrobe = useWardrobe();
    const createRequest = useCreateRepairRequest();

    const wardrobeDpps = useMemo(
        () => wardrobe.filter((item): item is PublicDppItem => item.kind === 'public-dpp'),
        [wardrobe],
    );

    const initialCode =
        prefillPublicCode && wardrobeDpps.some((d) => d.publicCode === prefillPublicCode) ? prefillPublicCode : null;
    const [publicCode, setPublicCode] = useState<string | null>(initialCode);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    const selectedDpp = publicCode ? wardrobeDpps.find((d) => d.publicCode === publicCode) : undefined;
    const title = repairer.companyName ?? repairer.displayName ?? 'ce retoucheur';

    function onSubmit(event: SyntheticEvent<HTMLFormElement>): void {
        event.preventDefault();
        if (createRequest.isPending) return;
        setError(null);

        if (!isAuthenticated) {
            router.push(`/auth/sign-in?returnTo=${encodeURIComponent(window.location.pathname)}`);
            return;
        }
        if (!publicCode) {
            setError('Choisis une pièce de ta Garde-Robe pour cette demande.');
            return;
        }

        createRequest.mutate(
            {
                repairerId: repairer.id,
                dppPublicCode: publicCode,
                message: message.trim().slice(0, MAX_MESSAGE) || undefined,
            },
            {
                onSuccess: () => router.push('/me/repairs'),
                onError: (err) => {
                    setError(isApiError(err) ? err.message : 'Impossible d’envoyer la demande.');
                },
            },
        );
    }

    const canSubmit = !createRequest.isPending && publicCode !== null;

    return (
        <div className="flex h-full flex-col overflow-y-auto bg-background pb-28">
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
                    <h1 className="truncate text-base font-bold text-foreground">Demander une retouche</h1>
                    <p className="truncate text-xs text-muted-foreground">
                        {title} {repairer.city ? `· ${repairer.city}` : ''}
                    </p>
                </div>
            </motion.header>

            <form onSubmit={onSubmit} className="flex flex-col gap-5 px-4">
                <fieldset className="flex flex-col gap-2">
                    <legend className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Pièce
                    </legend>
                    {selectedDpp ? (
                        <DppRow item={selectedDpp} onClear={() => setPublicCode(null)} />
                    ) : wardrobeDpps.length === 0 ? (
                        <p className="rounded-2xl border border-border/60 bg-card px-4 py-3 text-xs text-muted-foreground italic">
                            Aucune pièce LUMIRIS dans ta Garde-Robe pour l&apos;instant. Scanne un DPP puis reviens ici
                            pour envoyer ta demande.
                        </p>
                    ) : (
                        <DppPicker items={wardrobeDpps} onSelect={(code) => setPublicCode(code)} />
                    )}
                </fieldset>

                <fieldset className="flex flex-col gap-2">
                    <legend className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Message (optionnel)
                    </legend>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
                        maxLength={MAX_MESSAGE}
                        rows={5}
                        placeholder="Décris ce que tu veux faire retoucher - emplacement, dimensions approximatives, niveau d'urgence."
                        className="rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-lumiris-cyan/30"
                        aria-label="Message pour le retoucheur"
                    />
                    <p className="text-right font-mono text-[10px] text-muted-foreground/70">
                        {message.length}/{MAX_MESSAGE}
                    </p>
                </fieldset>

                {error ? (
                    <p className="text-xs text-destructive" role="alert">
                        {error}
                    </p>
                ) : null}

                <button
                    type="submit"
                    disabled={!canSubmit}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                    <Send className="h-4 w-4" />
                    {createRequest.isPending ? 'Envoi…' : 'Envoyer la demande'}
                </button>

                <p className="text-center text-[10px] text-muted-foreground/80">
                    Le retoucheur recevra ta demande et te répondra avec un devis. La commission LUMIRIS est prélevée
                    sur le devis accepté.
                </p>
            </form>
        </div>
    );
}

function DppRow({ item, onClear }: { item: PublicDppItem; onClear: () => void }) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3">
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{item.productName}</p>
                {item.grade ? <p className="truncate text-[11px] text-muted-foreground">Score {item.grade}</p> : null}
            </div>
            <button
                type="button"
                onClick={onClear}
                aria-label="Retirer la pièce"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground"
            >
                <X className="h-3 w-3" />
            </button>
        </div>
    );
}

function DppPicker({ items, onSelect }: { items: readonly PublicDppItem[]; onSelect: (publicCode: string) => void }) {
    return (
        <select
            onChange={(e) => onSelect(e.target.value)}
            defaultValue=""
            className="rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-lumiris-cyan/30"
            aria-label="Choisir une pièce"
        >
            <option value="" disabled>
                Choisir une pièce de la Garde-Robe…
            </option>
            {items.map((item) => (
                <option key={item.publicCode} value={item.publicCode}>
                    {item.productName}
                </option>
            ))}
        </select>
    );
}
