import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, type ComponentType, type SVGProps } from 'react';
import { motion } from 'framer-motion';
import { Archive, MapPin, Sparkles } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { LumirisLogo } from '@lumiris/ui/components/logo';
import { toast } from '@/lib/toast';
import { GlassCard, IridescentBackground, slideUpFade } from '@/lib/motion';

type LucideIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface ValueRowProps {
    Icon: LucideIcon;
    label: string;
}

const VALUES: readonly ValueRowProps[] = [
    { Icon: Archive, label: 'Garde-Robe synchronisée entre tes appareils' },
    { Icon: MapPin, label: 'Retoucheurs proches en un coup d’œil' },
    { Icon: Sparkles, label: 'Suggestions personnalisées selon ton style' },
];

const GUEST_TOAST_LABEL = 'Tu peux toujours créer un compte plus tard.';
const GUEST_TOAST_DELAY_MS = 1300;

export default function AuthPage() {
    const navigate = useNavigate();
    const [navigating, setNavigating] = useState(false);
    const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (navTimerRef.current !== null) clearTimeout(navTimerRef.current);
        };
    }, []);

    function handleContinueAsGuest(): void {
        if (navTimerRef.current !== null) return;
        setNavigating(true);
        toast.info(GUEST_TOAST_LABEL);
        navTimerRef.current = setTimeout(() => {
            navigate('/');
        }, GUEST_TOAST_DELAY_MS);
    }

    return (
        <div className="relative flex h-full flex-col items-center justify-center px-6 pb-10">
            <IridescentBackground intensity="subtle" />

            <motion.div className="w-full max-w-sm" variants={slideUpFade} initial="initial" animate="animate">
                <GlassCard className="p-7">
                    <header className="flex flex-col items-center text-center">
                        <LumirisLogo title="Lumiris" className="mb-3 h-10 w-auto" />
                        <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.32em]">
                            Lumiris
                        </p>
                        <h1 className="text-foreground mt-1 text-2xl font-bold tracking-tight">Vision</h1>
                        <p className="text-muted-foreground mt-3 text-sm">Scanne. Comprends. Choisis bien.</p>
                    </header>

                    <ul className="mt-7 flex flex-col gap-3">
                        {VALUES.map(({ Icon, label }) => (
                            <li key={label} className="flex items-center gap-3">
                                <span className="border-border/60 bg-background/60 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border">
                                    <Icon className="text-foreground/80 h-4 w-4" />
                                </span>
                                <span className="text-foreground/90 text-sm">{label}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-7 flex flex-col gap-2">
                        <Button
                            asChild
                            className="bg-foreground text-background hover:bg-foreground/90 h-11 w-full rounded-full text-sm font-semibold"
                        >
                            <Link to="/auth/sign-in?mode=signup">Créer un compte</Link>
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleContinueAsGuest}
                            disabled={navigating}
                            className="text-foreground hover:bg-foreground/5 h-11 w-full rounded-full text-sm"
                        >
                            Continuer sans compte
                        </Button>
                    </div>

                    <p className="text-muted-foreground mt-5 text-center text-xs">
                        Déjà un compte ?{' '}
                        <Link
                            to="/auth/sign-in"
                            className="text-foreground font-semibold underline-offset-4 hover:underline"
                        >
                            Se connecter
                        </Link>
                    </p>
                </GlassCard>
            </motion.div>

            <Link
                to="/about"
                className="text-muted-foreground hover:text-foreground mt-6 text-xs underline-offset-4 hover:underline"
            >
                À propos de LUMIRIS
            </Link>
        </div>
    );
}
