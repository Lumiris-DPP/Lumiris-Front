import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Armchair, BatteryCharging, Plus, Puzzle, Refrigerator, Shirt, Smartphone } from 'lucide-react';
import { cn } from '@lumiris/ui/lib/cn';
import { Input } from '@lumiris/ui/components/input';
import { Textarea } from '@lumiris/ui/components/textarea';
import { addManualItem, SECTOR_LABEL_FR, WARDROBE_SECTORS, type WardrobeSector } from '@/lib/wardrobe-storage';
import { toast } from '@/lib/toast';

const MAX_NAME = 80;
const MAX_BRAND = 60;
const MAX_NOTES = 400;

const SECTOR_ICON: Record<WardrobeSector, typeof Shirt> = {
    textile: Shirt,
    electronics: Smartphone,
    appliance: Refrigerator,
    furniture: Armchair,
    toy: Puzzle,
    battery: BatteryCharging,
};

export function VaultAdd() {
    const navigate = useNavigate();
    const [sector, setSector] = useState<WardrobeSector>('textile');
    const [productName, setProductName] = useState('');
    const [brand, setBrand] = useState('');
    const [acquiredAt, setAcquiredAt] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const canSubmit = !submitting && productName.trim().length > 0;

    function onSubmit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        if (!canSubmit) return;
        setSubmitting(true);
        addManualItem({
            sector,
            productName: productName.trim().slice(0, MAX_NAME),
            brand: brand.trim() || undefined,
            acquiredAt: acquiredAt || undefined,
            notes: notes.trim() || undefined,
        });
        toast.success('Produit ajouté à ton inventaire');
        navigate('/vault');
    }

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
                    <h1 className="text-foreground truncate text-base font-bold">Ajouter un produit</h1>
                    <p className="text-muted-foreground truncate text-xs">
                        Enregistre une pièce sans DPP dans ton inventaire personnel.
                    </p>
                </div>
            </motion.header>

            <form onSubmit={onSubmit} className="flex flex-col gap-5 px-4">
                <fieldset className="flex flex-col gap-2">
                    <legend className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                        Secteur
                    </legend>
                    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Secteur du produit">
                        {WARDROBE_SECTORS.map((s) => {
                            const Icon = SECTOR_ICON[s];
                            const active = sector === s;
                            return (
                                <button
                                    key={s}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    onClick={() => setSector(s)}
                                    className={cn(
                                        'flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-[11px] font-medium transition-colors',
                                        active
                                            ? 'border-lumiris-cyan bg-lumiris-cyan/10 text-lumiris-cyan'
                                            : 'border-border bg-card text-foreground/80',
                                    )}
                                >
                                    <Icon className="h-4 w-4" aria-hidden />
                                    {SECTOR_LABEL_FR[s]}
                                </button>
                            );
                        })}
                    </div>
                </fieldset>

                <fieldset className="flex flex-col gap-2">
                    <legend className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                        Nom du produit
                    </legend>
                    <Input
                        value={productName}
                        onChange={(e) => setProductName(e.target.value.slice(0, MAX_NAME))}
                        maxLength={MAX_NAME}
                        placeholder="Ex. : Chemise lin écru"
                        required
                        aria-label="Nom du produit"
                    />
                </fieldset>

                <fieldset className="flex flex-col gap-2">
                    <legend className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                        Marque (optionnel)
                    </legend>
                    <Input
                        value={brand}
                        onChange={(e) => setBrand(e.target.value.slice(0, MAX_BRAND))}
                        maxLength={MAX_BRAND}
                        placeholder="Ex. : Atelier Jean"
                        aria-label="Marque"
                    />
                </fieldset>

                <fieldset className="flex flex-col gap-2">
                    <legend className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                        Date d&apos;achat (optionnel)
                    </legend>
                    <Input
                        type="date"
                        value={acquiredAt}
                        onChange={(e) => setAcquiredAt(e.target.value)}
                        aria-label="Date d'achat"
                    />
                </fieldset>

                <fieldset className="flex flex-col gap-2">
                    <legend className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                        Notes (optionnel)
                    </legend>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES))}
                        maxLength={MAX_NOTES}
                        rows={4}
                        placeholder="Taille, couleur, achat de seconde main, garantie restante…"
                        aria-label="Notes"
                    />
                    <p className="text-muted-foreground/70 text-right font-mono text-[10px]">
                        {notes.length}/{MAX_NOTES}
                    </p>
                </fieldset>

                <button
                    type="submit"
                    disabled={!canSubmit}
                    className="bg-foreground text-primary-foreground inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-50"
                >
                    <Plus className="h-4 w-4" />
                    Ajouter à l&apos;inventaire
                </button>

                <p className="text-muted-foreground/80 text-center text-[10px]">
                    Cette pièce reste personnelle - elle ne crée pas de DPP et n&apos;est pas publiée sur LUMIRIS.
                </p>
            </form>
        </div>
    );
}
