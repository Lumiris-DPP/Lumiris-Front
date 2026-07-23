import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Share2, GitCompareArrows, BookmarkPlus, BookmarkCheck, ShoppingBag, FileText } from 'lucide-react';
import { cn } from '@lumiris/ui/lib/cn';
import type { Passport } from '@lumiris/types';
import type { ArtisanWithSlug } from '@lumiris/mock-data';
import { addToWardrobe, removeLumirisPassport, type WardrobeDocument } from '@/lib/wardrobe-storage';
import { toast } from '@/lib/toast';
import { BuySheet } from './buy-sheet';
import { DocumentsSheet } from './documents-sheet';

interface ActionBarProps {
    passport: Passport;
    artisan: ArtisanWithSlug | null;
    isSaved: boolean;
    documents: readonly WardrobeDocument[];
}

export function ActionBar({ passport, artisan, isSaved, documents }: ActionBarProps) {
    const navigate = useNavigate();
    const [buyOpen, setBuyOpen] = useState(false);
    const [docsOpen, setDocsOpen] = useState(false);

    const onShare = useCallback(async () => {
        const url =
            typeof window !== 'undefined' ? window.location.href : `https://lumiris.fr/passeport/${passport.id}`;
        const title = passport.garment.reference;
        if (typeof navigator !== 'undefined' && 'share' in navigator) {
            try {
                await navigator.share({ title, url });
                return;
            } catch {
                // L'utilisateur peut annuler - on retombe sur le presse-papier silencieusement.
            }
        }
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            await navigator.clipboard.writeText(url);
            toast.success('Lien copié');
        }
    }, [passport.id, passport.garment.reference]);

    const onCompare = useCallback(() => {
        navigate(`/vault?compareWith=${encodeURIComponent(passport.id)}`);
    }, [navigate, passport.id]);

    const onToggleSave = useCallback(() => {
        if (isSaved) removeLumirisPassport(passport.id);
        else addToWardrobe(passport.id);
    }, [isSaved, passport.id]);

    const buyDisabled = !artisan?.websiteUrl;
    const docsCount = documents.length;

    return (
        <>
            <motion.nav
                aria-label="Actions du passeport"
                className="border-border/50 bg-background/85 fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md items-center justify-around gap-1 border-t px-4 pb-6 pt-3 backdrop-blur-xl"
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32, delay: 0.4 }}
            >
                <ActionButton onClick={() => navigate(-1)} label="Fermer" Icon={X} />
                <ActionButton onClick={onShare} label="Partager" Icon={Share2} />
                <ActionButton onClick={onCompare} label="Comparer" Icon={GitCompareArrows} />
                <ActionButton
                    onClick={() => setDocsOpen(true)}
                    label="Documents"
                    Icon={FileText}
                    badge={docsCount > 0 ? docsCount : undefined}
                    active={docsCount > 0}
                />
                <ActionButton
                    onClick={() => setBuyOpen(true)}
                    label="Acheter"
                    Icon={ShoppingBag}
                    disabled={buyDisabled}
                />
                <ActionButton
                    onClick={onToggleSave}
                    label={isSaved ? 'Retirer' : 'Garde-Robe'}
                    Icon={isSaved ? BookmarkCheck : BookmarkPlus}
                    active={isSaved}
                />
            </motion.nav>

            {artisan ? (
                <BuySheet open={buyOpen} onOpenChange={setBuyOpen} passport={passport} artisan={artisan} />
            ) : null}

            <DocumentsSheet open={docsOpen} onOpenChange={setDocsOpen} passportId={passport.id} documents={documents} />
        </>
    );
}

interface ActionButtonProps {
    onClick: () => void;
    label: string;
    Icon: typeof X;
    active?: boolean;
    disabled?: boolean;
    badge?: number;
}

function ActionButton({ onClick, label, Icon, active = false, disabled = false, badge }: ActionButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            className={cn(
                'flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-colors active:scale-95',
                disabled
                    ? 'text-muted-foreground/40 active:scale-100'
                    : active
                      ? 'text-lumiris-cyan'
                      : 'text-foreground/80 hover:text-foreground',
            )}
        >
            <span className="relative inline-flex">
                <Icon className="h-5 w-5" aria-hidden />
                {badge !== undefined && badge > 0 ? (
                    <span
                        aria-hidden
                        className="bg-lumiris-cyan text-background absolute -right-2 -top-1 inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold leading-none"
                    >
                        {badge > 9 ? '9+' : badge}
                    </span>
                ) : null}
            </span>
            <span className="text-[10px] font-medium tracking-wide">{label}</span>
        </button>
    );
}
