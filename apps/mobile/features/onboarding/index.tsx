'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion, type PanInfo } from 'framer-motion';
import { ArrowLeft, ArrowRight, Archive, ScanLine, Sparkles } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { GlassCard, IridescentBackground, slideUpFade } from '@/lib/motion';
import { markOnboardingCompleted } from '@/lib/onboarding/storage';

interface Slide {
    Icon: typeof ScanLine;
    eyebrow: string;
    title: string;
    body: string;
}

const SLIDES: readonly Slide[] = [
    {
        Icon: ScanLine,
        eyebrow: 'Scan',
        title: 'Scanne le QR du passeport produit',
        body: 'Pointe l’iris sur le QR cousu dans l’étiquette : composition, atelier, factures et certifs en un clin d’œil.',
    },
    {
        Icon: Sparkles,
        eyebrow: 'Grade',
        title: 'Lis le grade Iris en un coup d’œil',
        body: 'Un score A → E mêle transparence, savoir-faire, impact et réparabilité. Tu vois pourquoi en deux secondes.',
    },
    {
        Icon: Archive,
        eyebrow: 'Vault',
        title: 'Garde-Robe & retoucheurs proches',
        body: 'Empile tes pièces dans le Vault, retrouve un artisan local pour prolonger leur vie au lieu d’en racheter.',
    },
];

const SWIPE_THRESHOLD = 60;

export function Onboarding() {
    const router = useRouter();
    const [index, setIndex] = useState(0);
    const isLast = index === SLIDES.length - 1;

    function goTo(next: number): void {
        const clamped = Math.max(0, Math.min(SLIDES.length - 1, next));
        setIndex(clamped);
    }

    function finish(): void {
        markOnboardingCompleted();
        router.push('/auth');
    }

    function handleDragEnd(_: unknown, info: PanInfo): void {
        if (info.offset.x < -SWIPE_THRESHOLD) goTo(index + 1);
        else if (info.offset.x > SWIPE_THRESHOLD) goTo(index - 1);
    }

    return (
        <div className="relative flex h-full flex-col px-6 pt-[max(env(safe-area-inset-top),3rem)] pb-10">
            <IridescentBackground intensity="subtle" />

            <header className="flex items-center justify-end">
                <button
                    type="button"
                    onClick={finish}
                    className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    Passer
                </button>
            </header>

            <motion.div
                className="mt-6 flex flex-1 flex-col items-center justify-center"
                variants={slideUpFade}
                initial="initial"
                animate="animate"
            >
                <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.18}
                    onDragEnd={handleDragEnd}
                    className="w-full max-w-sm cursor-grab touch-pan-y active:cursor-grabbing"
                >
                    {SLIDES[index] ? <SlideCard slide={SLIDES[index]} index={index} /> : null}
                </motion.div>

                <Dots count={SLIDES.length} active={index} onSelect={goTo} />
            </motion.div>

            <nav aria-label="Navigation onboarding" className="mt-6 flex items-center justify-between gap-3">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => goTo(index - 1)}
                    disabled={index === 0}
                    className="h-11 rounded-full px-4 text-sm text-foreground/80 hover:bg-foreground/5 disabled:opacity-30"
                    aria-label="Slide précédente"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>

                {isLast ? (
                    <Button
                        type="button"
                        onClick={finish}
                        className="h-11 flex-1 rounded-full bg-foreground text-sm font-semibold text-background hover:bg-foreground/90"
                    >
                        Continuer
                    </Button>
                ) : (
                    <Button
                        type="button"
                        onClick={() => goTo(index + 1)}
                        className="h-11 flex-1 rounded-full bg-foreground text-sm font-semibold text-background hover:bg-foreground/90"
                    >
                        Suivant
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </nav>
        </div>
    );
}

interface SlideCardProps {
    slide: Slide;
    index: number;
}

function SlideCard({ slide, index }: SlideCardProps): ReactNode {
    const { Icon, eyebrow, title, body } = slide;
    return (
        <motion.div
            key={index}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
        >
            <GlassCard className="flex flex-col items-center p-7 text-center">
                <span
                    aria-hidden
                    className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-border/60 bg-background/60"
                >
                    <Icon className="h-7 w-7 text-foreground/80" strokeWidth={1.5} />
                </span>
                <p className="text-[10px] font-semibold tracking-[0.28em] text-muted-foreground uppercase">{eyebrow}</p>
                <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground">{title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </GlassCard>
        </motion.div>
    );
}

interface DotsProps {
    count: number;
    active: number;
    onSelect: (index: number) => void;
}

function Dots({ count, active, onSelect }: DotsProps) {
    return (
        <div className="mt-6 flex items-center gap-2" role="tablist" aria-label="Slides">
            {Array.from({ length: count }, (_, i) => {
                const isActive = i === active;
                return (
                    <button
                        key={i}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={`Aller à la slide ${i + 1}`}
                        onClick={() => onSelect(i)}
                        className={`h-1.5 rounded-full transition-all ${
                            isActive ? 'w-6 bg-foreground' : 'w-1.5 bg-foreground/25'
                        }`}
                    >
                        <span className="sr-only">Slide {i + 1}</span>
                    </button>
                );
            })}
        </div>
    );
}
