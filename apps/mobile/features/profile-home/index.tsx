import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronRight,
    FileText,
    Info,
    LifeBuoy,
    LogOut,
    Package,
    Settings as SettingsIcon,
    ShieldCheck,
    User,
    Wrench,
} from 'lucide-react';
import { IrisGrade as IrisGradeBadge } from '@lumiris/scoring-ui';
import { Button } from '@lumiris/ui/components/button';
import { GlassCard, IridescentBackground, slideUpFade } from '@/lib/motion';
import { useUser } from '@/lib/auth';
import { useWardrobeStats } from '@/lib/iris/wardrobe-stats';

export function ProfileHome() {
    const { user, isAuthenticated } = useUser();

    if (!isAuthenticated || user === null) {
        return <LoggedOut />;
    }

    return <LoggedIn displayName={user.displayName} email={user.email} city={user.city ?? null} />;
}

function LoggedOut() {
    return (
        <div className="relative flex h-full flex-col items-center justify-center px-6 pb-28">
            <IridescentBackground intensity="subtle" />

            <motion.div className="w-full max-w-sm" variants={slideUpFade} initial="initial" animate="animate">
                <GlassCard className="flex flex-col items-center p-7 text-center">
                    <span
                        aria-hidden
                        className="border-border/60 bg-background/60 mb-5 flex h-16 w-16 items-center justify-center rounded-full border"
                    >
                        <User className="text-muted-foreground h-12 w-12" strokeWidth={1.4} />
                    </span>
                    <h1 className="text-foreground text-lg font-semibold">Pas encore de compte</h1>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                        Crée un compte pour synchroniser ta Garde-Robe et débloquer les retoucheurs locaux.
                    </p>

                    <Button
                        asChild
                        className="bg-foreground text-background hover:bg-foreground/90 mt-6 h-11 w-full rounded-full text-sm font-semibold"
                    >
                        <Link to="/auth">Créer un compte</Link>
                    </Button>

                    <Link
                        to="/about"
                        className="text-muted-foreground hover:text-foreground mt-4 text-xs underline-offset-4 hover:underline"
                    >
                        À propos de LUMIRIS
                    </Link>
                </GlassCard>
            </motion.div>
        </div>
    );
}

interface LoggedInProps {
    displayName: string;
    email: string;
    city: string | null;
}

function LoggedIn({ displayName, email, city }: LoggedInProps) {
    const navigate = useNavigate();
    const stats = useWardrobeStats();
    const { signOut } = useUser();
    const [signingOut, setSigningOut] = useState(false);

    const initial = displayName.trim().charAt(0).toUpperCase() || 'L';
    const items = stats.items.length;
    const overallGrade = stats.scoredCount > 0 ? stats.overall.grade : null;

    function handleSignOut(): void {
        if (signingOut) return;
        setSigningOut(true);
        signOut();
        navigate('/');
    }

    return (
        <div className="relative flex h-full flex-col overflow-y-auto pb-28">
            <IridescentBackground intensity="subtle" />

            <motion.header
                className="px-5 pb-5 pt-[max(env(safe-area-inset-top),3rem)]"
                variants={slideUpFade}
                initial="initial"
                animate="animate"
            >
                <div className="flex items-center gap-4">
                    <span
                        aria-hidden
                        className="from-lumiris-cyan to-lumiris-iris bg-linear-to-br flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-semibold text-white shadow-md"
                    >
                        {initial}
                    </span>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-foreground truncate text-lg font-semibold">{displayName}</h1>
                        <p className="text-muted-foreground truncate text-xs">{email}</p>
                        {city ? <p className="text-muted-foreground/80 truncate text-[11px]">{city}</p> : null}
                    </div>
                </div>
            </motion.header>

            <motion.section
                className="grid grid-cols-2 gap-3 px-4"
                variants={slideUpFade}
                initial="initial"
                animate="animate"
            >
                <StatCard label="Items scannés" value={String(items)} accent="text-foreground" />
                <StatCard
                    label="Grade moyen"
                    value={overallGrade ?? '-'}
                    accent="text-foreground"
                    badge={overallGrade ? <IrisGradeBadge grade={overallGrade} size="sm" tone="solid" /> : null}
                />
                <StatCard
                    label="CO₂ évité (est.)"
                    value={`${formatNumber(stats.impact.co2AvoidedKg)} kg`}
                    accent="text-lumiris-emerald"
                />
                <StatCard
                    label="Eau économisée (est.)"
                    value={`${formatNumber(stats.impact.waterSavedLiters)} L`}
                    accent="text-lumiris-cyan"
                />
            </motion.section>

            <motion.ul
                className="mt-6 flex flex-col gap-2 px-4"
                variants={slideUpFade}
                initial="initial"
                animate="animate"
            >
                <ActionLink href="/me/orders" Icon={Package} label="Mes commandes" />
                <ActionLink href="/me/repairs" Icon={Wrench} label="Mes demandes" />
                <ActionLink href="/me/documents" Icon={FileText} label="Mes documents" />
                <ActionLink href="/me/settings" Icon={SettingsIcon} label="Réglages" />
                <ActionLink href="/me/privacy" Icon={ShieldCheck} label="Confidentialité" />
                <ActionLink href="/help" Icon={LifeBuoy} label="Aide / Support" />
                <ActionLink href="/about" Icon={Info} label="À propos" />
            </motion.ul>

            <div className="mt-4 px-4">
                <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="border-lumiris-rose/30 bg-lumiris-rose/5 text-lumiris-rose hover:bg-lumiris-rose/10 inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-semibold transition disabled:opacity-50"
                >
                    <LogOut className="h-4 w-4" />
                    Se déconnecter
                </button>
            </div>
        </div>
    );
}

interface StatCardProps {
    label: string;
    value: string;
    accent: string;
    badge?: ReactNode;
}

function StatCard({ label, value, accent, badge }: StatCardProps) {
    return (
        <GlassCard className="flex flex-col gap-1 p-4" intensity="subtle">
            <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">{label}</p>
            <div className="flex items-baseline justify-between gap-2">
                <p className={`${accent} font-mono text-xl font-bold`}>{value}</p>
                {badge}
            </div>
        </GlassCard>
    );
}

interface ActionLinkProps {
    href: string;
    Icon: typeof SettingsIcon;
    label: string;
    external?: boolean;
}

function ActionLink({ href, Icon, label, external = false }: ActionLinkProps) {
    const className =
        'border-border/60 bg-card/60 hover:bg-card/80 flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm backdrop-blur-md transition-colors';
    const content = (
        <>
            <span className="text-foreground inline-flex items-center gap-3">
                <Icon className="text-muted-foreground h-4 w-4" />
                {label}
            </span>
            <ChevronRight className="text-muted-foreground/60 h-4 w-4" />
        </>
    );

    if (external) {
        return (
            <li>
                <a href={href} className={className}>
                    {content}
                </a>
            </li>
        );
    }

    return (
        <li>
            <Link to={href} className={className}>
                {content}
            </Link>
        </li>
    );
}

function formatNumber(n: number): string {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(n);
}
