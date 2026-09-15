import type { ReactNode } from 'react';

import { ConsentSettingsLink } from './consent-banner';

/**
 * Contenu légal partagé par les 4 apps Lumiris (admin, atelier, vision, site), pour des mentions
 * RGPD homogènes. Chaque app en fait une page fine `/confidentialite` et `/mentions-legales`.
 *
 * Version provisoire : les champs entre crochets sont à compléter et l'ensemble à faire valider
 * juridiquement avant l'ouverture au public.
 */

const LAST_REVIEWED = '2026-09-09';

function reviewedOn(): string {
    return new Date(LAST_REVIEWED).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function Shell({ title, children }: { title: string; children: ReactNode }) {
    return (
        <main className="min-h-screen bg-background pt-24 pb-24">
            <header className="mx-auto max-w-3xl px-6">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
                <p className="mt-3 text-sm text-muted-foreground">
                    Version provisoire — à finaliser avant l&apos;ouverture au public. Dernière revue&nbsp;:{' '}
                    <span className="font-mono text-foreground">{reviewedOn()}</span>.
                </p>
            </header>
            <section className="mx-auto mt-10 max-w-3xl space-y-8 px-6 text-sm leading-relaxed">{children}</section>
        </main>
    );
}

function Block({ heading, children }: { heading: string; children: ReactNode }) {
    return (
        <div>
            <h2 className="text-base font-semibold text-foreground">{heading}</h2>
            <div className="mt-2 space-y-2 text-muted-foreground">{children}</div>
        </div>
    );
}

const privacyMail = (
    <a href="mailto:privacy@lumiris.fr" className="text-foreground underline underline-offset-4">
        privacy@lumiris.fr
    </a>
);

export function PrivacyPolicy({ appLabel }: { appLabel: string }) {
    return (
        <Shell title="Politique de confidentialité">
            <p className="text-muted-foreground">
                Cette politique couvre le traitement des données personnelles dans le cadre de {appLabel}. Le
                responsable de traitement est Lumiris SAS — <span className="font-mono">[adresse, SIREN]</span>.
            </p>

            <Block heading="Données collectées">
                <p>
                    Selon votre usage&nbsp;: compte (e-mail, nom, rôle), contenu que vous créez (passeports, demandes,
                    messages), données de commande et de facturation, et une mesure d&apos;audience et de performance{' '}
                    <strong>anonyme</strong> (Web Vitals). Aucun cookie publicitaire, aucun traceur tiers.
                </p>
            </Block>

            <Block heading="Finalités et bases légales">
                <p>
                    Fournir et sécuriser le service (exécution du contrat)&nbsp;; vérifier l&apos;identité
                    professionnelle des artisans et retoucheurs (obligation légale / intérêt légitime)&nbsp;; améliorer
                    la qualité du service (intérêt légitime). Le détail figure au registre des traitements, disponible
                    sur demande.
                </p>
            </Block>

            <Block heading="Destinataires et sous-traitants">
                <p>
                    Prestataires strictement nécessaires&nbsp;: paiement (Stripe), e-mails (Resend), expédition
                    (Sendcloud), supervision d&apos;erreurs (Sentry, sans donnée personnelle), hébergement. Certains
                    sont situés hors UE&nbsp;; les transferts sont encadrés par des clauses contractuelles types.
                </p>
            </Block>

            <Block heading="Durées de conservation">
                <p>
                    Compte&nbsp;: pendant son activité, puis suppression en deux temps (désactivation immédiate,
                    anonymisation définitive après 30&nbsp;jours). Commandes et factures&nbsp;: 10&nbsp;ans (obligation
                    comptable), dissociées de votre identité. Mesure d&apos;audience&nbsp;:{' '}
                    <span className="font-mono">[X]</span> mois.
                </p>
            </Block>

            <Block heading="Vos droits">
                <p>
                    Vous disposez des droits d&apos;accès, de rectification, d&apos;effacement, d&apos;opposition, de
                    limitation et de portabilité. Depuis votre compte&nbsp;:
                </p>
                <ul className="list-disc space-y-1 pl-5">
                    <li>
                        <strong>Exporter mes données</strong> — une archive de vos données personnelles vous est remise
                        sous 48&nbsp;h.
                    </li>
                    <li>
                        <strong>Supprimer mon compte</strong> — désactivation immédiate, effacement définitif sous
                        30&nbsp;jours.
                    </li>
                </ul>
                <p>
                    Pour toute autre demande, ou pour saisir notre délégué à la protection des données&nbsp;:{' '}
                    {privacyMail}. Vous pouvez également introduire une réclamation auprès de la CNIL.
                </p>
            </Block>

            <Block heading="Cookies et mesure d'audience">
                <p>
                    Lumiris ne dépose aucun cookie publicitaire ni traceur tiers. La mesure d&apos;audience et de
                    performance est anonyme et soumise à votre consentement, recueilli via un bandeau au premier accès.
                    Vous pouvez revenir sur ce choix à tout moment&nbsp;:{' '}
                    <ConsentSettingsLink className="text-foreground underline underline-offset-4" />.
                </p>
            </Block>
        </Shell>
    );
}

export function LegalNotice({ appLabel }: { appLabel: string }) {
    return (
        <Shell title="Mentions légales">
            <Block heading="Éditeur">
                <p>
                    {appLabel} est édité par Lumiris SAS, <span className="font-mono">[forme sociale, capital]</span>,
                    immatriculée au RCS de <span className="font-mono">[ville]</span> sous le numéro{' '}
                    <span className="font-mono">[SIREN]</span>, siège social{' '}
                    <span className="font-mono">[adresse]</span>. TVA intracommunautaire{' '}
                    <span className="font-mono">[n° TVA]</span>.
                </p>
            </Block>
            <Block heading="Directeur de la publication">
                <p>
                    <span className="font-mono">[nom du représentant légal]</span>.
                </p>
            </Block>
            <Block heading="Hébergement">
                <p>
                    <span className="font-mono">[hébergeur retenu]</span> —{' '}
                    <span className="font-mono">[adresse et contact de l&apos;hébergeur]</span>.
                </p>
            </Block>
            <Block heading="Contact">
                <p>
                    <a href="mailto:legal@lumiris.fr" className="text-foreground underline underline-offset-4">
                        legal@lumiris.fr
                    </a>{' '}
                    pour les questions légales, {privacyMail} pour les données personnelles.
                </p>
            </Block>
        </Shell>
    );
}
