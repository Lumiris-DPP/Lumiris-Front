import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, CheckCircle2 } from 'lucide-react';
import type { Repairer, RepairerSpecialty } from '@lumiris/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@lumiris/ui/components/sheet';
import { cn } from '@lumiris/ui/lib/cn';
import { addRepairRequest } from '@/lib/repairs/storage';
import { toast } from '@/lib/toast';

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

const MAX_MESSAGE = 400;

interface BookingSheetProps {
    repairer: Repairer;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BookingSheet({ repairer, open, onOpenChange }: BookingSheetProps) {
    const [specialty, setSpecialty] = useState<RepairerSpecialty>(repairer.specialities[0] ?? 'alteration');
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);

    function reset() {
        setSpecialty(repairer.specialities[0] ?? 'alteration');
        setMessage('');
        setSubmitted(false);
    }

    function handleOpenChange(next: boolean) {
        onOpenChange(next);
        if (!next) setTimeout(reset, 250);
    }

    function handleSubmit() {
        if (message.trim().length === 0) return;
        addRepairRequest({
            id: Date.now().toString(36),
            repairerId: repairer.id,
            passportId: null,
            specialty,
            description: message.trim().slice(0, MAX_MESSAGE),
            photos: [],
            createdAt: new Date().toISOString(),
            status: 'pending',
        });
        toast.success('Demande de RDV envoyée');
        setSubmitted(true);
    }

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent
                side="bottom"
                className="mx-auto max-h-[85vh] max-w-md overflow-y-auto rounded-t-3xl px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-6"
            >
                {submitted ? (
                    <div className="flex flex-col items-center gap-5 py-6 text-center">
                        <span className="bg-lumiris-emerald/10 text-lumiris-emerald inline-flex h-16 w-16 items-center justify-center rounded-full">
                            <CheckCircle2 className="h-8 w-8" strokeWidth={1.5} aria-hidden />
                        </span>
                        <SheetHeader className="items-center px-0 text-center">
                            <SheetTitle className="text-lg">Demande envoyée</SheetTitle>
                            <SheetDescription className="text-pretty text-sm">
                                {repairer.displayName} te recontactera pour confirmer le rendez-vous et établir un
                                devis.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="flex w-full flex-col gap-2">
                            <Link
                                to="/me/repairs"
                                className="bg-foreground text-background inline-flex h-12 w-full items-center justify-center rounded-full text-sm font-semibold"
                            >
                                Voir mes demandes
                            </Link>
                            <button
                                type="button"
                                onClick={() => handleOpenChange(false)}
                                className="text-muted-foreground hover:text-foreground inline-flex h-11 w-full items-center justify-center text-sm font-medium"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <SheetHeader className="px-0 text-left">
                            <SheetTitle className="flex items-center gap-2 text-base">
                                <CalendarCheck className="text-primary h-4 w-4" strokeWidth={1.5} aria-hidden />
                                Prendre rendez-vous
                            </SheetTitle>
                            <SheetDescription className="text-xs">
                                {repairer.atelierName ?? repairer.displayName} · {repairer.city}
                            </SheetDescription>
                        </SheetHeader>

                        <div className="mt-5 flex flex-col gap-5">
                            <fieldset className="flex flex-col gap-2">
                                <legend className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                                    Prestation
                                </legend>
                                <ul className="flex flex-wrap gap-1.5">
                                    {repairer.specialities.map((s) => {
                                        const active = specialty === s;
                                        return (
                                            <li key={s}>
                                                <button
                                                    type="button"
                                                    aria-pressed={active}
                                                    onClick={() => setSpecialty(s)}
                                                    className={cn(
                                                        'inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                                                        'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                                                        active
                                                            ? 'border-primary bg-primary/10 text-primary'
                                                            : 'border-border/60 bg-card text-muted-foreground hover:text-foreground',
                                                    )}
                                                >
                                                    {SPECIALITY_LABEL[s]}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </fieldset>

                            <fieldset className="flex flex-col gap-2">
                                <legend className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                                    Message
                                </legend>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
                                    maxLength={MAX_MESSAGE}
                                    rows={4}
                                    placeholder="Décris ta demande : pièce concernée, type de retouche, délai souhaité."
                                    aria-label="Message de demande de rendez-vous"
                                    className="border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:ring-primary/30 rounded-2xl border px-3 py-2.5 text-sm outline-none focus:ring-2"
                                />
                                <p className="text-muted-foreground/70 text-right font-mono text-[10px] tabular-nums">
                                    {message.length}/{MAX_MESSAGE}
                                </p>
                            </fieldset>

                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={message.trim().length === 0}
                                className="bg-foreground text-background inline-flex h-12 w-full items-center justify-center rounded-full text-sm font-semibold active:scale-[0.98] disabled:opacity-50"
                            >
                                Envoyer la demande
                            </button>
                            <p className="text-muted-foreground/80 text-center text-[10px]">
                                Demande sans engagement. Le retoucheur te recontacte pour le devis.
                            </p>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
