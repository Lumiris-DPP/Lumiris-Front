'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Switch } from '@lumiris/ui/components/switch';
import { Tabs, TabsList, TabsTrigger } from '@lumiris/ui/components/tabs';
import type { NotificationCategory } from '@lumiris/api-client';
import { useNotificationPreferences, useUpdateNotificationPreference } from '@lumiris/api-client/react';
import { useUser } from '@/lib/auth';
import { SectionLabel } from '@/lib/section';
import { GlassCard, IridescentBackground, slideUpFade } from '@/lib/motion';
import { updateSettings, useSettings, type Settings, type ThemePref } from '@/lib/settings';
import { usePushOptIn } from './use-push-optin';

const APP_VERSION = '0.1.0';

export function ProfileSettings() {
    const { user, isAuthenticated } = useUser();
    const settings = useSettings();

    if (!isAuthenticated || user === null) {
        return <NotConnectedNotice />;
    }

    return (
        <div className="relative flex h-full flex-col overflow-y-auto pb-28">
            <IridescentBackground intensity="subtle" />

            <Header />

            <motion.div className="flex flex-col gap-5 px-4" variants={slideUpFade} initial="initial" animate="animate">
                <AccountSection displayName={user.displayName} email={user.email} city={user.city ?? ''} />
                <AppearanceSection settings={settings} />
                <NotificationsSection />
                <PushSection />
                <PrivacyLink />
            </motion.div>

            <Footer />
        </div>
    );
}

function Header() {
    return (
        <motion.header
            className="px-5 pt-[max(env(safe-area-inset-top),3rem)] pb-5"
            variants={slideUpFade}
            initial="initial"
            animate="animate"
        >
            <Link
                href="/me"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Profil
            </Link>
            <h1 className="mt-2 text-xl font-bold text-foreground">Réglages</h1>
        </motion.header>
    );
}

function NotConnectedNotice() {
    return (
        <div className="relative flex h-full flex-col items-center justify-center px-6 pb-28 text-center">
            <IridescentBackground intensity="subtle" />
            <p className="text-sm font-medium text-foreground">Pas connecté.</p>
            <p className="mt-2 text-xs text-muted-foreground">Les réglages de compte demandent un compte LUMIRIS.</p>
            <Button
                asChild
                className="mt-4 h-10 rounded-full bg-foreground px-5 text-sm font-semibold text-background hover:bg-foreground/90"
            >
                <Link href="/auth">Créer un compte</Link>
            </Button>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-3">
            <SectionLabel title={title} />
            <GlassCard intensity="subtle" className="flex flex-col">
                {children}
            </GlassCard>
        </section>
    );
}

function Row({ children, last = false }: { children: React.ReactNode; last?: boolean }) {
    return (
        <div className={`flex items-center justify-between gap-3 px-4 py-3 ${last ? '' : 'border-b border-border/40'}`}>
            {children}
        </div>
    );
}

interface AccountSectionProps {
    displayName: string;
    email: string;
    city: string;
}

function AccountSection({ displayName, email, city }: AccountSectionProps) {
    const { updateUser } = useUser();
    const nameId = useId();
    const emailId = useId();
    const cityId = useId();
    const [draftName, setDraftName] = useState(displayName);
    const [draftCity, setDraftCity] = useState(city);

    useEffect(() => {
        setDraftName(displayName);
    }, [displayName]);
    useEffect(() => {
        setDraftCity(city);
    }, [city]);

    const dirty = draftName.trim() !== displayName || draftCity.trim() !== city;

    function commit() {
        const trimmedName = draftName.trim();
        const trimmedCity = draftCity.trim();
        updateUser({
            displayName: trimmedName.length > 0 ? trimmedName : displayName,
            city: trimmedCity,
        });
    }

    return (
        <Section title="Compte">
            <div className="flex flex-col gap-3 p-4">
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor={nameId} className="text-xs text-muted-foreground">
                        Nom
                    </Label>
                    <Input
                        id={nameId}
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        onBlur={commit}
                        autoComplete="name"
                        className="bg-background/60"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor={emailId} className="text-xs text-muted-foreground">
                        Email
                    </Label>
                    <Input
                        id={emailId}
                        value={email}
                        readOnly
                        aria-readonly
                        className="cursor-not-allowed bg-muted/40"
                    />
                    <p className="text-[10px] text-muted-foreground/80">Non modifiable en mode démo.</p>
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor={cityId} className="text-xs text-muted-foreground">
                        Ville
                    </Label>
                    <Input
                        id={cityId}
                        value={draftCity}
                        onChange={(e) => setDraftCity(e.target.value)}
                        onBlur={commit}
                        autoComplete="address-level2"
                        placeholder="Lyon, Marseille…"
                        className="bg-background/60"
                    />
                </div>
                {dirty ? (
                    <p className="text-[10px] text-muted-foreground">
                        Les modifications sont enregistrées en quittant le champ.
                    </p>
                ) : null}
            </div>
        </Section>
    );
}

const THEME_OPTIONS: ReadonlyArray<{ value: ThemePref; label: string }> = [
    { value: 'system', label: 'Système' },
    { value: 'light', label: 'Clair' },
    { value: 'dark', label: 'Sombre' },
];

function AppearanceSection({ settings }: { settings: Settings }) {
    const reduceMotionId = useId();

    useEffect(() => {
        if (typeof document === 'undefined') return;
        document.documentElement.setAttribute('data-theme', settings.theme);
        document.documentElement.setAttribute('data-reduce-motion', settings.reduceMotion ? 'true' : 'false');
    }, [settings.theme, settings.reduceMotion]);

    return (
        <Section title="Apparence">
            <Row>
                <span className="text-sm text-foreground">Thème</span>
                <Tabs value={settings.theme} onValueChange={(value) => updateSettings({ theme: value as ThemePref })}>
                    <TabsList className="h-8">
                        {THEME_OPTIONS.map((opt) => (
                            <TabsTrigger key={opt.value} value={opt.value} className="px-3 text-xs">
                                {opt.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </Row>
            <Row last>
                <Label htmlFor={reduceMotionId} className="text-sm font-normal text-foreground">
                    Réduire les animations
                </Label>
                <Switch
                    id={reduceMotionId}
                    checked={settings.reduceMotion}
                    onCheckedChange={(v) => updateSettings({ reduceMotion: v })}
                />
            </Row>
        </Section>
    );
}

// Ordre d'affichage pensé pour un acheteur : ce qui touche à son argent et ses achats d'abord,
// l'entretien et les favoris ensuite. Les libellés couvrent l'email — le push suivra le même
// découpage par catégorie une fois le canal branché.
const CATEGORY_ORDER: readonly NotificationCategory[] = [
    'ORDERS',
    'PAYMENTS',
    'RETURNS_DISPUTES',
    'PASSPORT',
    'ATELIER',
    'WARDROBE',
    'FAVORITES',
];

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
    ORDERS: 'Commandes',
    PAYMENTS: 'Paiements',
    RETURNS_DISPUTES: 'Retours & litiges',
    PASSPORT: 'Passeports produits',
    ATELIER: 'Atelier (retouches)',
    WARDROBE: 'Garde-Robe (entretien, garantie, certificats)',
    FAVORITES: 'Favoris (stock, prix)',
};

function NotificationsSection() {
    const { data: preferences = [], isLoading } = useNotificationPreferences();
    const updatePreference = useUpdateNotificationPreference();
    const byCategory = new Map(preferences.map((pref) => [pref.category, pref]));

    return (
        <Section title="Notifications">
            {isLoading ? (
                <div className="px-4 py-3 text-xs text-muted-foreground">Chargement…</div>
            ) : (
                CATEGORY_ORDER.map((category, i) => {
                    const pref = byCategory.get(category);
                    const emailEnabled = pref?.emailEnabled ?? true;
                    const pushEnabled = pref?.pushEnabled ?? true;
                    const id = `notif-${category}`;
                    return (
                        <Row key={category} last={i === CATEGORY_ORDER.length - 1}>
                            <Label htmlFor={id} className="text-sm font-normal text-foreground">
                                {CATEGORY_LABELS[category]}
                            </Label>
                            <Switch
                                id={id}
                                checked={emailEnabled}
                                onCheckedChange={(v) =>
                                    updatePreference.mutate({ category, emailEnabled: v, pushEnabled })
                                }
                            />
                        </Row>
                    );
                })
            )}
        </Section>
    );
}

// Le toggle par catégorie ci-dessus ne couvre que l'email pour l'instant (voir NotificationsSection) —
// celui-ci est le seul endroit qui active/désactive le canal push lui-même (opt-in navigateur +
// abonnement côté back), séparément du choix par catégorie.
function PushSection() {
    const { status, pending, toggle } = usePushOptIn();

    if (status === 'unsupported') {
        return null;
    }

    return (
        <Section title="Notifications push">
            <Row last>
                <div className="flex flex-col gap-0.5">
                    <Label htmlFor="push-optin" className="text-sm font-normal text-foreground">
                        Recevoir des notifications push
                    </Label>
                    {status === 'unavailable' ? (
                        <span className="text-[11px] text-muted-foreground">Indisponible pour le moment.</span>
                    ) : null}
                    {status === 'denied' ? (
                        <span className="text-[11px] text-muted-foreground">
                            Bloquées au niveau du navigateur — à réactiver dans ses réglages.
                        </span>
                    ) : null}
                </div>
                <Switch
                    id="push-optin"
                    checked={status === 'on'}
                    disabled={status === 'unavailable' || status === 'denied' || pending}
                    onCheckedChange={toggle}
                />
            </Row>
        </Section>
    );
}

function PrivacyLink() {
    return (
        <Section title="Données">
            <Link
                href="/me/privacy"
                className="group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-background/40"
            >
                <span className="inline-flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-lumiris-cyan" />
                    <span className="flex flex-col">
                        <span className="text-sm text-foreground">Confidentialité &amp; données</span>
                        <span className="text-[11px] text-muted-foreground">
                            Export, effacement, suppression de compte.
                        </span>
                    </span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
            </Link>
        </Section>
    );
}

function Footer() {
    return (
        <footer className="mt-8 px-4 text-center text-[11px] text-muted-foreground/70">
            <p>LUMIRIS Vision · v{APP_VERSION} · Mode démo</p>
            <Link
                href="/about"
                className="mt-1 inline-flex items-center gap-1 underline-offset-4 hover:text-foreground hover:underline"
            >
                À propos
                <ChevronRight className="h-3 w-3" />
            </Link>
        </footer>
    );
}
