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
        <div className="bg-background flex h-full flex-col overflow-y-auto pb-28">
            <motion.header
                className="flex items-center gap-3 px-4 pb-3 pt-12"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button
                    type="button"
                    onClick={() => router.back()}
                    aria-label="Retour"
                    className="border-border bg-card text-foreground inline-flex h-9 w-9 items-center justify-center rounded-full border"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="text-foreground truncate text-base font-bold">Demander une retouche</h1>
                    <p className="text-muted-foreground truncate text-xs">
                        {title} {repairer.city ? `· ${repairer.city}` : ''}
                    </p>
                </div>
            </motion.header>

            <form onSubmit={onSubmit} className="flex flex-col gap-5 px-4">
                <fieldset className="flex flex-col gap-2">
                    <legend className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                        Pièce
                    </legend>
                    {selectedDpp ? (
                        <DppRow item={selectedDpp} onClear={() => setPublicCode(null)} />
                    ) : wardrobeDpps.length === 0 ? (
                        <p className="border-border/60 bg-card text-muted-foreground rounded-2xl border px-4 py-3 text-xs italic">
                            Aucune pièce LUMIRIS dans ta Garde-Robe pour l&apos;instant. Scanne un DPP puis reviens ici
                            pour envoyer ta demande.
                        </p>
                    ) : (
                        <DppPicker items={wardrobeDpps} onSelect={(code) => setPublicCode(code)} />
                    )}
                </fieldset>

                <fieldset className="flex flex-col gap-2">
                    <legend className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                        Message (optionnel)
                    </legend>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
                        maxLength={MAX_MESSAGE}
                        rows={5}
                        placeholder="Décris ce que tu veux faire retoucher - emplacement, dimensions approximatives, niveau d'urgence."
                        className="border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:ring-lumiris-cyan/30 rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2"
                        aria-label="Message pour le retoucheur"
                    />
                    <p className="text-muted-foreground/70 text-right font-mono text-[10px]">
                        {message.length}/{MAX_MESSAGE}
                    </p>
                </fieldset>

                {error ? (
                    <p className="text-destructive text-xs" role="alert">
                        {error}
                    </p>
                ) : null}

                <button
                    type="submit"
                    disabled={!canSubmit}
                    className="bg-foreground text-primary-foreground inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-50"
                >
                    <Send className="h-4 w-4" />
                    {createRequest.isPending ? 'Envoi…' : 'Envoyer la demande'}
                </button>

                <p className="text-muted-foreground/80 text-center text-[10px]">
                    Le retoucheur recevra ta demande et te répondra avec un devis. La commission LUMIRIS est prélevée
                    sur le devis accepté.
                </p>
            </form>
        </div>
    );
}

function DppRow({ item, onClear }: { item: PublicDppItem; onClear: () => void }) {
    return (
        <div className="border-border/60 bg-card flex items-center gap-3 rounded-2xl border p-3">
            <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-semibold">{item.productName}</p>
                {item.grade ? <p className="text-muted-foreground truncate text-[11px]">Score {item.grade}</p> : null}
            </div>
            <button
                type="button"
                onClick={onClear}
                aria-label="Retirer la pièce"
                className="border-border text-muted-foreground inline-flex h-7 w-7 items-center justify-center rounded-full border"
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
            className="border-border bg-card text-foreground focus:ring-lumiris-cyan/30 rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2"
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
