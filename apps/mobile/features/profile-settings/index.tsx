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
import { useUser } from '@/lib/auth';
import { SectionLabel } from '@/lib/section';
import { GlassCard, IridescentBackground, slideUpFade } from '@/lib/motion';
import { updateSettings, useSettings, type Settings, type ThemePref } from '@/lib/settings';

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
                <NotificationsSection settings={settings} />
                <PrivacyLink />
            </motion.div>

            <Footer />
        </div>
    );
}

function Header() {
    return (
        <motion.header
            className="px-5 pb-5 pt-[max(env(safe-area-inset-top),3rem)]"
            variants={slideUpFade}
            initial="initial"
            animate="animate"
        >
            <Link
                href="/me"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Profil
            </Link>
            <h1 className="text-foreground mt-2 text-xl font-bold">Réglages</h1>
        </motion.header>
    );
}

function NotConnectedNotice() {
    return (
        <div className="relative flex h-full flex-col items-center justify-center px-6 pb-28 text-center">
            <IridescentBackground intensity="subtle" />
            <p className="text-foreground text-sm font-medium">Pas connecté.</p>
            <p className="text-muted-foreground mt-2 text-xs">Les réglages de compte demandent un compte LUMIRIS.</p>
            <Button
                asChild
                className="bg-foreground text-background hover:bg-foreground/90 mt-4 h-10 rounded-full px-5 text-sm font-semibold"
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
        <div className={`flex items-center justify-between gap-3 px-4 py-3 ${last ? '' : 'border-border/40 border-b'}`}>
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
                    <Label htmlFor={nameId} className="text-muted-foreground text-xs">
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
                    <Label htmlFor={emailId} className="text-muted-foreground text-xs">
                        Email
                    </Label>
                    <Input
                        id={emailId}
                        value={email}
                        readOnly
                        aria-readonly
                        className="bg-muted/40 cursor-not-allowed"
                    />
                    <p className="text-muted-foreground/80 text-[10px]">Non modifiable en mode démo.</p>
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor={cityId} className="text-muted-foreground text-xs">
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
                    <p className="text-muted-foreground text-[10px]">
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
                <span className="text-foreground text-sm">Thème</span>
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
                <Label htmlFor={reduceMotionId} className="text-foreground text-sm font-normal">
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

const NOTIFS: ReadonlyArray<{ key: keyof Settings; label: string }> = [
    { key: 'notifNewArticles', label: 'Nouveaux articles Journal' },
    { key: 'notifNewArtisans', label: 'Nouveaux passeports d’artisans suivis' },
    { key: 'notifReminders', label: 'Rappels d’entretien Garde-Robe' },
];

function NotificationsSection({ settings }: { settings: Settings }) {
    return (
        <Section title="Notifications">
            {NOTIFS.map(({ key, label }, i) => {
                const value = settings[key] as boolean;
                const id = `notif-${key}`;
                return (
                    <Row key={key} last={i === NOTIFS.length - 1}>
                        <Label htmlFor={id} className="text-foreground text-sm font-normal">
                            {label}
                        </Label>
                        <Switch
                            id={id}
                            checked={value}
                            onCheckedChange={(v) => updateSettings({ [key]: v } as Partial<Settings>)}
                        />
                    </Row>
                );
            })}
        </Section>
    );
}

function PrivacyLink() {
    return (
        <Section title="Données">
            <Link
                href="/me/privacy"
                className="hover:bg-background/40 group flex items-center justify-between gap-3 px-4 py-3 transition-colors"
            >
                <span className="inline-flex items-center gap-3">
                    <ShieldCheck className="text-lumiris-cyan h-4 w-4" />
                    <span className="flex flex-col">
                        <span className="text-foreground text-sm">Confidentialité &amp; données</span>
                        <span className="text-muted-foreground text-[11px]">
                            Export, effacement, suppression de compte.
                        </span>
                    </span>
                </span>
                <ChevronRight className="text-muted-foreground/60 h-4 w-4" />
            </Link>
        </Section>
    );
}

function Footer() {
    return (
        <footer className="text-muted-foreground/70 mt-8 px-4 text-center text-[11px]">
            <p>LUMIRIS Vision · v{APP_VERSION} · Mode démo</p>
            <Link
                href="/about"
                className="hover:text-foreground mt-1 inline-flex items-center gap-1 underline-offset-4 hover:underline"
            >
                À propos
                <ChevronRight className="h-3 w-3" />
            </Link>
        </footer>
    );
}
