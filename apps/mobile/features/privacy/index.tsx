'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Database, Download, ShieldCheck, Trash2, UserX } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@lumiris/ui/components/alert-dialog';
import { useDeleteAccount } from '@lumiris/api-client/react';
import { useUser } from '@/lib/auth';
import { wipeAllUserData } from '@/lib/auth/wipe';
import { useWardrobe } from '@/lib/wardrobe-storage';
import { useSettings } from '@/lib/settings';
import { USER_KEYS, userScopedKey } from '@/lib/storage-keys';
import { GlassCard, IridescentBackground, slideUpFade } from '@/lib/motion';
import { SectionLabel } from '@/lib/section';
import { toast } from '@/lib/toast';

const APP_VERSION = '0.1.0';
// TODO(RGPD) : remplacer par l'adresse DPO officielle une fois le contrat DPO signé.
const DPO_EMAIL = 'privacy@lumiris.eu';

export function Privacy() {
    return (
        <div className="relative flex h-full flex-col overflow-y-auto pb-28">
            <IridescentBackground intensity="subtle" />

            <Header />

            <motion.div className="flex flex-col gap-5 px-4" variants={slideUpFade} initial="initial" animate="animate">
                <DataCollectedSection />
                <DpoSection />
                <RightsSection />
            </motion.div>
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
                href="/me/settings"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Réglages
            </Link>
            <div className="mt-3 flex items-center gap-3">
                <span
                    aria-hidden
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/60"
                >
                    <ShieldCheck className="h-5 w-5 text-lumiris-cyan" />
                </span>
                <div>
                    <h1 className="text-xl font-bold text-foreground">Confidentialité & données</h1>
                    <p className="text-xs text-muted-foreground">
                        RGPD - ce qu&apos;on stocke, et ce que tu contrôles.
                    </p>
                </div>
            </div>
        </motion.header>
    );
}

function Section({ title, Icon, children }: { title: string; Icon?: typeof ShieldCheck; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-3">
            <SectionLabel title={title} Icon={Icon} />
            <GlassCard intensity="subtle" className="flex flex-col p-4">
                {children}
            </GlassCard>
        </section>
    );
}

interface DataItem {
    label: string;
    detail: string;
}

const DATA_COLLECTED: readonly DataItem[] = [
    {
        label: 'Compte',
        detail: 'Ton email et ton nom sont enregistrés côté serveur pour te connecter et rattacher tes commandes. Un jeton de session est conservé sur cet appareil.',
    },
    {
        label: 'Commandes & paiement',
        detail: 'Tes commandes et factures sont conservées côté serveur. Les paiements sont traités par Stripe ; Lumiris ne stocke aucune donnée de carte bancaire.',
    },
    {
        label: 'Garde-Robe',
        detail: 'Les pièces achetées (passeport, facture, garantie) sont enregistrées côté serveur, rattachées à ton compte. Les pièces que tu scannes et tes notes d’entretien restent sur cet appareil.',
    },
    {
        label: 'Scans & réglages',
        detail: 'Ton compteur de scans et tes préférences (thème, animations, notifications) restent locaux à ce navigateur.',
    },
];

function DataCollectedSection() {
    return (
        <Section title="Données collectées" Icon={Database}>
            <ul className="flex flex-col gap-3">
                {DATA_COLLECTED.map((item) => (
                    <li key={item.label} className="flex items-start gap-3">
                        <span className="mt-1.5 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-lumiris-cyan/60" />
                        <div>
                            <p className="text-sm font-semibold text-foreground">{item.label}</p>
                            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                        </div>
                    </li>
                ))}
            </ul>
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground/80">
                Nous limitons la collecte au strict nécessaire au fonctionnement du service (compte, commandes,
                Garde-Robe). Les données de paiement sont isolées chez Stripe et ne transitent jamais par nos serveurs.
            </p>
        </Section>
    );
}

function DpoSection() {
    return (
        <Section title="Délégué à la protection (DPO)">
            <p className="text-sm leading-relaxed text-foreground/90">
                DPO mutualisé via{' '}
                <a href={`mailto:${DPO_EMAIL}`} className="text-foreground underline-offset-4 hover:underline">
                    {DPO_EMAIL}
                </a>
                . Toute demande RGPD (accès, rectification, opposition) est traitée sous 30 jours.
            </p>
        </Section>
    );
}

function RightsSection() {
    const { user, signOut } = useUser();
    const wardrobe = useWardrobe();
    const settings = useSettings();
    const router = useRouter();
    const deleteAccount = useDeleteAccount();

    const exportPayload = useMemo(
        () => ({
            exportedAt: new Date().toISOString(),
            version: APP_VERSION,
            user: user
                ? {
                      displayName: user.displayName,
                      email: user.email,
                      city: user.city ?? null,
                      createdAt: user.createdAt,
                  }
                : null,
            wardrobe,
            settings,
        }),
        [user, wardrobe, settings],
    );

    function handleExport() {
        if (typeof window === 'undefined') return;
        const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lumiris-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function handleClearWardrobe() {
        if (typeof window === 'undefined') return;
        window.localStorage.removeItem(userScopedKey(user?.id ?? null, USER_KEYS.wardrobe));
        window.dispatchEvent(new CustomEvent('lumiris:wardrobe-changed'));
    }

    async function handleDeleteAccount() {
        // RGPD : on anonymise le compte côté serveur (DELETE /api/auth/me) AVANT de purger le
        // local. En cas d'échec réseau, on n'efface pas le local pour permettre une nouvelle
        // tentative — sinon on laisserait une session locale orpheline sans suppression serveur.
        try {
            await deleteAccount.mutateAsync();
        } catch {
            toast.error('La suppression a échoué. Réessaie ou contacte le support.');
            return;
        }
        // Ordre critique : wipe avant signOut, sinon le scope `lumiris.users.{id}.*` reste.
        wipeAllUserData();
        signOut();
        toast.success('Ton compte a été supprimé.');
        router.push('/');
    }

    const wardrobeCount = wardrobe.length;

    return (
        <Section title="Mes droits">
            <div className="flex flex-col gap-3">
                <RightRow
                    Icon={Download}
                    title="Exporter mes données"
                    description="JSON lisible - compte, garde-robe, réglages."
                >
                    <button
                        type="button"
                        onClick={handleExport}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-background/80"
                    >
                        <Download className="h-3.5 w-3.5" />
                        Exporter
                    </button>
                </RightRow>

                <RightRow
                    Icon={Trash2}
                    title="Effacer ma garde-robe locale"
                    description={
                        wardrobeCount === 0
                            ? 'Aucune pièce stockée pour le moment.'
                            : `${wardrobeCount} pièce${wardrobeCount > 1 ? 's' : ''} stockée${wardrobeCount > 1 ? 's' : ''} dans ce navigateur.`
                    }
                >
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button
                                type="button"
                                disabled={wardrobeCount === 0}
                                className="inline-flex items-center gap-1.5 rounded-full border border-lumiris-rose/30 bg-lumiris-rose/5 px-3 py-1.5 text-xs font-semibold text-lumiris-rose transition hover:bg-lumiris-rose/10 disabled:opacity-40"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Effacer
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Effacer toute ta garde-robe ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Toutes les pièces que tu as ajoutées seront retirées. Ton historique
                                    d&apos;entretien sera perdu. Cette action est définitive.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleClearWardrobe}
                                    className="bg-lumiris-rose text-white hover:bg-lumiris-rose/90"
                                >
                                    Effacer
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </RightRow>

                <RightRow
                    Icon={UserX}
                    title="Supprimer mon compte"
                    description="Ton compte est anonymisé côté serveur, puis toutes tes données locales sont effacées."
                >
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button
                                type="button"
                                disabled={user === null || deleteAccount.isPending}
                                className="inline-flex items-center gap-1.5 rounded-full border border-lumiris-rose/30 bg-lumiris-rose/5 px-3 py-1.5 text-xs font-semibold text-lumiris-rose transition hover:bg-lumiris-rose/10 disabled:opacity-40"
                            >
                                <UserX className="h-3.5 w-3.5" />
                                Supprimer
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer ton compte LUMIRIS ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Ton compte sera anonymisé côté serveur (RGPD) : email, nom et garde-robe seront
                                    dissociés de ton identité. Tes commandes et factures sont conservées de façon
                                    anonymisée pour nos obligations comptables et légales. Tes données locales (scans,
                                    réglages) sont ensuite effacées de ce navigateur. Cette action est définitive.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteAccount}
                                    className="bg-lumiris-rose text-white hover:bg-lumiris-rose/90"
                                >
                                    Supprimer
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </RightRow>
            </div>
        </Section>
    );
}

interface RightRowProps {
    Icon: typeof Download;
    title: string;
    description: string;
    children: React.ReactNode;
}

function RightRow({ Icon, title, description, children }: RightRowProps) {
    return (
        <div className="flex items-start justify-between gap-3 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-border/40 [&:not(:last-child)]:pb-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
                </div>
            </div>
            {children}
        </div>
    );
}
