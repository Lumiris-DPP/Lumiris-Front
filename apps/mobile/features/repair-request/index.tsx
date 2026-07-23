import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ImagePlus, Send, X } from 'lucide-react';
import { mockPassportById } from '@lumiris/mock-data';
import type { Passport, Repairer, RepairerSpecialty } from '@lumiris/types';
import { useWardrobe } from '@/lib/wardrobe-storage';
import { addRepairRequest } from '@/lib/repairs/storage';
import { trackAffiliateClick } from '@/lib/affiliate/track';

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

const MAX_DESC = 500;
const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 1_000_000;

interface RepairRequestFormProps {
    repairer: Repairer;
    prefillPassportId: string | null;
}

export function RepairRequestForm({ repairer, prefillPassportId }: RepairRequestFormProps) {
    const navigate = useNavigate();
    const wardrobe = useWardrobe();

    const wardrobePassports = useMemo(
        () =>
            wardrobe
                .map((item) => (item.kind === 'lumiris-passport' ? mockPassportById(item.passportId) : undefined))
                .filter((p): p is Passport => p !== undefined),
        [wardrobe],
    );

    const initialPassport = prefillPassportId ? mockPassportById(prefillPassportId) : undefined;
    const [passportId, setPassportId] = useState<string | null>(initialPassport?.id ?? null);
    const [specialty, setSpecialty] = useState<RepairerSpecialty>(repairer.specialities[0] ?? 'alteration');
    const [description, setDescription] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(false);

    const selectedPassport = passportId ? mockPassportById(passportId) : null;

    async function onPhotoChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
        const files = Array.from(event.target.files ?? []);
        event.target.value = '';
        if (files.length === 0) return;
        const remaining = MAX_PHOTOS - photos.length;
        if (remaining <= 0) {
            setPhotoError(`Maximum ${MAX_PHOTOS} photos.`);
            return;
        }
        const accepted = files.slice(0, remaining);
        const dataUrls: string[] = [];
        for (const file of accepted) {
            if (file.size > MAX_PHOTO_BYTES) {
                setPhotoError(`Une photo dépasse 1 Mo (${file.name}).`);
                continue;
            }
            try {
                dataUrls.push(await readAsDataUrl(file));
            } catch {
                setPhotoError('Lecture du fichier impossible.');
            }
        }
        if (dataUrls.length === 0) return;
        setPhotos((prev) => [...prev, ...dataUrls].slice(0, MAX_PHOTOS));
        if (dataUrls.length === accepted.length) setPhotoError(null);
    }

    function removePhoto(index: number): void {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
    }

    function onSubmit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        if (submitting) return;
        if (description.trim().length === 0) return;
        setSubmitting(true);

        const requestId = Date.now().toString(36);
        addRepairRequest({
            id: requestId,
            repairerId: repairer.id,
            passportId,
            specialty,
            description: description.trim().slice(0, MAX_DESC),
            photos,
            createdAt: new Date().toISOString(),
            status: 'pending',
        });

        trackAffiliateClick({
            source: 'repair-request',
            repairerId: repairer.id,
            passportId,
            requestId,
        });

        setToast(true);
        window.setTimeout(() => navigate('/me/repairs'), 700);
    }

    const canSubmit = !submitting && description.trim().length > 0;

    return (
        <div className="bg-background flex h-full flex-col overflow-y-auto pb-28">
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
                    <h1 className="text-foreground truncate text-base font-bold">Demander une retouche</h1>
                    <p className="text-muted-foreground truncate text-xs">
                        {repairer.atelierName ?? repairer.displayName} · {repairer.city}
                    </p>
                </div>
            </motion.header>

            <form onSubmit={onSubmit} className="flex flex-col gap-5 px-4">
                <fieldset className="flex flex-col gap-2">
                    <legend className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                        Pièce
                    </legend>
                    {selectedPassport ? (
                        <PassportRow passport={selectedPassport} onClear={() => setPassportId(null)} />
                    ) : wardrobePassports.length === 0 ? (
                        <p className="border-border/60 bg-card text-muted-foreground rounded-2xl border px-4 py-3 text-xs italic">
                            Tu n&apos;as pas encore de pièce dans ta Garde-Robe - tu peux quand même envoyer une demande
                            générique.
                        </p>
                    ) : (
                        <PassportPicker passports={wardrobePassports} onSelect={(id) => setPassportId(id)} />
                    )}
                </fieldset>

                <fieldset className="flex flex-col gap-2">
                    <legend className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                        Type de prestation
                    </legend>
                    <ul className="flex flex-wrap gap-1.5">
                        {repairer.specialities.map((s) => {
                            const active = specialty === s;
                            return (
                                <li key={s}>
                                    <label
                                        className={`inline-flex cursor-pointer items-center rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                                            active
                                                ? 'border-lumiris-cyan bg-lumiris-cyan/10 text-lumiris-cyan'
                                                : 'border-border bg-card text-muted-foreground'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="specialty"
                                            value={s}
                                            checked={active}
                                            onChange={() => setSpecialty(s)}
                                            aria-label={SPECIALITY_LABEL[s]}
                                            className="sr-only"
                                        />
                                        {SPECIALITY_LABEL[s]}
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                </fieldset>

                <fieldset className="flex flex-col gap-2">
                    <legend className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                        Description
                    </legend>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC))}
                        maxLength={MAX_DESC}
                        rows={5}
                        placeholder="Décris ce que tu veux faire retoucher - emplacement, dimensions approximatives, niveau d'urgence."
                        className="border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:ring-lumiris-cyan/30 rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2"
                        aria-label="Description de la demande"
                        required
                    />
                    <p className="text-muted-foreground/70 text-right font-mono text-[10px]">
                        {description.length}/{MAX_DESC}
                    </p>
                </fieldset>

                <fieldset className="flex flex-col gap-2">
                    <legend className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                        Photos ({photos.length}/{MAX_PHOTOS})
                    </legend>
                    <ul className="flex flex-wrap gap-2">
                        {photos.map((src, idx) => (
                            <li key={`${idx}-${src.length}`} className="relative h-20 w-20">
                                <img
                                    src={src}
                                    alt={`Pièce jointe ${idx + 1}`}
                                    className="border-border h-full w-full rounded-xl border object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => removePhoto(idx)}
                                    aria-label={`Retirer la pièce jointe ${idx + 1}`}
                                    className="border-border bg-card text-foreground absolute -right-1.5 -top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border shadow"
                                >
                                    <X className="h-2.5 w-2.5" />
                                </button>
                            </li>
                        ))}
                        {photos.length < MAX_PHOTOS ? (
                            <li>
                                <label className="border-border/60 bg-card text-muted-foreground flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-[10px]">
                                    <ImagePlus className="h-5 w-5" />
                                    Ajouter
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={onPhotoChange}
                                        aria-label="Ajouter des photos"
                                        className="sr-only"
                                    />
                                </label>
                            </li>
                        ) : null}
                    </ul>
                    {photoError ? (
                        <p className="text-lumiris-rose text-[11px]">{photoError}</p>
                    ) : (
                        <p className="text-muted-foreground/70 text-[10px]">JPG / PNG, max 1 Mo par photo.</p>
                    )}
                </fieldset>

                <button
                    type="submit"
                    disabled={!canSubmit}
                    className="bg-foreground text-primary-foreground inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-50"
                >
                    <Send className="h-4 w-4" />
                    Envoyer la demande
                </button>

                <p className="text-muted-foreground/80 text-center text-[10px]">
                    Le retoucheur recevra ta demande par email. La commission LUMIRIS est prélevée sur le devis accepté.
                </p>
            </form>

            {toast ? (
                <motion.div
                    role="status"
                    className="border-lumiris-cyan/40 bg-card/95 text-foreground pointer-events-none fixed left-1/2 top-24 z-50 -translate-x-1/2 rounded-2xl border px-4 py-2 text-xs font-medium shadow-xl backdrop-blur-md"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    Demande envoyée - redirection vers tes demandes…
                </motion.div>
            ) : null}
        </div>
    );
}

function PassportRow({ passport, onClear }: { passport: Passport; onClear: () => void }) {
    return (
        <div className="border-border/60 bg-card flex items-center gap-3 rounded-2xl border p-3">
            <div className="bg-secondary/40 relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                {passport.garment.mainPhotoUrl ? (
                    <img
                        src={passport.garment.mainPhotoUrl}
                        alt={passport.garment.reference}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                ) : null}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-semibold">{passport.garment.reference}</p>
                <p className="text-muted-foreground truncate text-[11px]">
                    {passport.garment.retailPrice}{' '}
                    {passport.garment.currency === 'EUR' ? '€' : passport.garment.currency}
                </p>
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

function PassportPicker({ passports, onSelect }: { passports: readonly Passport[]; onSelect: (id: string) => void }) {
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
            {passports.map((p) => (
                <option key={p.id} value={p.id}>
                    {p.garment.reference}
                </option>
            ))}
        </select>
    );
}

function readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result === 'string') resolve(result);
            else reject(new Error('Unexpected reader result'));
        };
        reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
        reader.readAsDataURL(file);
    });
}
