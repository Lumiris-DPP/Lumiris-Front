import type { Metadata } from 'next';
import Link from 'next/link';
import { History, Scale, ShieldCheck } from 'lucide-react';
import { GithubMark } from '@lumiris/ui/components/github-mark';
import { Card, CardContent } from '@lumiris/ui/components/card';

export const metadata: Metadata = {
    title: 'Charte d’indépendance - Aucun acteur n’achète son score',
    description:
        'La charte d’indépendance LUMIRIS en sept articles. Score Iris algorithmique, modèle économique public, code source ouvert, datasets versionnés. Ce que nous ne ferons jamais.',
    alternates: { canonical: '/charte-independance' },
};

interface Commissioner {
    name: string;
    role: string;
    affiliation: string;
}

const COMMISSION: readonly Commissioner[] = [
    {
        name: 'Catherine Larrère',
        role: 'Présidente',
        affiliation: 'Philosophe de l’environnement, professeure émérite Paris-1 Panthéon-Sorbonne',
    },
    {
        name: 'Karim Benabdallah',
        role: 'Auditeur',
        affiliation: 'Ancien commissaire aux comptes, expert en gouvernance ESG',
    },
    {
        name: 'Nadia Renault',
        role: 'Représentante artisans',
        affiliation: 'Présidente de l’UNAC - Union nationale des artisans couturiers',
    },
    {
        name: 'François Trémoulet',
        role: 'Représentant consommateurs',
        affiliation: 'UFC-Que Choisir, commission textile',
    },
    {
        name: 'Anne-Sophie Devaux',
        role: 'Juriste',
        affiliation: 'Avocate au barreau de Paris, droit de la consommation et ESPR',
    },
];

const COMMISSION_SIGNED_AT = '2026-01-15';
const SOURCE_REPO_URL = 'https://github.com/lumiris-fr/lumiris';

interface BaselineRelease {
    version: string;
    effectiveAt: string;
    summary: string;
    changes: readonly string[];
}

const BASELINE_RELEASES: readonly BaselineRelease[] = [
    {
        version: 'v1.2.0',
        effectiveAt: '2026-08-01',
        summary: 'Bascule baseline carbone laine + cachemire sur ADEME 2025.',
        changes: [
            'Coefficient carbone laine : 22 → 20 kg CO₂e/kg (ADEME Base Empreinte 2025-Q1).',
            'Coefficient carbone cachemire : 28 → 32 kg CO₂e/kg (Higg MSI v3.6, élevage extensif).',
            'Plafond carbone d’un produit textile « neutre » : 12 → 11 kg CO₂e (durcissement).',
        ],
    },
    {
        version: 'v1.1.0',
        effectiveAt: '2026-04-30',
        summary: 'Pondération réparabilité revue après pilote LUMIRIS Local.',
        changes: [
            'Bonus réparabilité fibre laine + lin : +5 pts.',
            'Pénalité réparabilité polyester non recyclé : −10 pts.',
            'Seuil minimum « 3 retoucheurs dans un rayon de 25 km » formalisé.',
        ],
    },
    {
        version: 'v1.0.0',
        effectiveAt: '2026-01-15',
        summary: 'Première publication officielle de l’algorithme Iris 40/25/25/10.',
        changes: [
            'Poids des 4 piliers gelés à 40 / 25 / 25 / 10.',
            'Coefficients carbone : ADEME Base Empreinte 2024-Q4 + Higg MSI v3.5.',
            'Coefficients eau : Water Footprint Network 2024.',
            'Plafond D obligatoire si un champ ESPR ou AGEC est manquant.',
        ],
    },
];

const ARTICLES: ReadonlyArray<{ n: number; title: string; body: string }> = [
    {
        n: 1,
        title: 'Le score n’est pas à vendre',
        body: 'Aucun artisan, aucune marque, aucun fournisseur ne peut acheter, négocier ou influencer son score Iris. Le score est calculé par algorithme déterministe, à partir des données vérifiées du passeport.',
    },
    {
        n: 2,
        title: 'Cinq lignes de revenus, toutes publiques',
        body: 'Notre modèle économique : abonnements ATELIER (29 / 79 / 149 €), add-on ATELIER+ (39 €/mois), abonnements LOCAL retoucheurs (190 €/an), API enterprise pour les marques (devis), formations payantes. Aucun revenu ne provient de la modification de scores ni du paiement de placements éditoriaux.',
    },
    {
        n: 3,
        title: 'Pas de placement sponsorisé sur les fiches',
        body: 'Aucun encart sponsorisé sur une fiche artisan, sur une fiche produit ni sur un score Iris. Le seul placement payant - ATELIER+ - modifie la visibilité dans l’annuaire mais jamais le score.',
    },
    {
        n: 4,
        title: 'Algorithme open-source',
        body: 'Le code de @lumiris/core est public sur GitHub. La formule Iris (40 / 25 / 25 / 10) est auditable par n’importe qui, à n’importe quel moment.',
    },
    {
        n: 5,
        title: 'Datasets versionnés et publiés',
        body: 'Les baselines carbone (ADEME 2024 + Higg MSI v3.5), eau (Water Footprint Network), seuils de réparabilité sont publiés et versionnés. Tout changement est annoncé 90 jours avant application - jamais rétroactivement.',
    },
    {
        n: 6,
        title: 'Recours indépendant',
        body: 'Si un consommateur, un artisan ou un journaliste a un doute fondé sur l’indépendance d’un score, il peut saisir notre commission externe. Les saisines et les décisions sont publiées.',
    },
    {
        n: 7,
        title: 'Engagement de fermeture',
        body: 'Si nous violons l’un des six articles précédents, nous nous engageons à fermer le service. Cet article est gravé dans nos statuts.',
    },
];

export default function CharteIndependancePage() {
    return (
        <div className="pt-28 pb-20">
            <header className="mx-auto max-w-3xl px-6">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="text-grade-a h-7 w-7" />
                    <p className="text-xs font-medium tracking-[0.25em] text-muted-foreground uppercase">
                        Charte d’indépendance
                    </p>
                </div>
                <h1 className="mt-4 text-4xl font-bold tracking-tight text-balance text-foreground sm:text-5xl">
                    Aucun acteur n’achète son score Iris.
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">
                    LUMIRIS s’est créé en réaction. En réaction à des labels privés qui notent leurs propres clients. En
                    réaction à des plateformes qui empilent les badges sponsorisés. Voici, en sept articles, ce que nous
                    ne ferons jamais.
                </p>
            </header>

            <section className="mx-auto mt-12 max-w-3xl px-6">
                <ol className="space-y-4">
                    {ARTICLES.map((a) => (
                        <li key={a.n}>
                            <Card>
                                <CardContent className="flex gap-5 p-6">
                                    <div className="shrink-0 font-mono text-3xl leading-none font-semibold text-muted-foreground">
                                        {String(a.n).padStart(2, '0')}
                                    </div>
                                    <div>
                                        <p className="text-lg leading-snug font-semibold text-foreground">{a.title}</p>
                                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </li>
                    ))}
                </ol>
            </section>

            <section aria-labelledby="commission-heading" className="mx-auto mt-16 max-w-3xl px-6">
                <div className="flex items-center gap-3">
                    <Scale className="text-grade-b h-6 w-6" />
                    <h2 id="commission-heading" className="text-2xl font-semibold tracking-tight text-foreground">
                        Commission d’indépendance
                    </h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Cinq personnalités externes - sans contrat commercial avec LUMIRIS - sont saisissables par tout
                    consommateur, artisan ou journaliste qui doute de l’indépendance d’un score Iris ou d’un placement
                    éditorial. Mandat de trois ans, signé le{' '}
                    <span className="font-mono text-foreground">
                        {new Date(COMMISSION_SIGNED_AT).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </span>
                    .
                </p>

                <ul className="mt-6 space-y-3">
                    {COMMISSION.map((c) => (
                        <li key={c.name}>
                            <Card>
                                <CardContent className="p-5">
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                                        <p className="font-semibold text-foreground">{c.name}</p>
                                        <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                            {c.role}
                                        </p>
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">{c.affiliation}</p>
                                </CardContent>
                            </Card>
                        </li>
                    ))}
                </ul>

                <p className="mt-6 text-sm text-muted-foreground">
                    Une saisine ?{' '}
                    <a
                        href="mailto:commission@lumiris.fr"
                        className="text-foreground underline-offset-4 hover:underline"
                    >
                        commission@lumiris.fr
                    </a>{' '}
                    - toutes les saisines reçues et leurs décisions sont publiées sur{' '}
                    <Link
                        href="/charte-independance/saisines"
                        className="text-foreground underline-offset-4 hover:underline"
                    >
                        la page des saisines
                    </Link>
                    .
                </p>
            </section>

            <section aria-labelledby="baselines-heading" className="mx-auto mt-16 max-w-3xl px-6">
                <div className="flex items-center gap-3">
                    <History className="text-grade-c h-6 w-6" />
                    <h2 id="baselines-heading" className="text-2xl font-semibold tracking-tight text-foreground">
                        Changelog des datasets baseline
                    </h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Chaque version d’un coefficient (carbone, eau, seuils ESPR) est annoncée 90 jours avant son entrée
                    en vigueur. Les versions historiques restent disponibles pour rejouer un score à n’importe quelle
                    date.
                </p>

                <ol className="mt-6 space-y-4">
                    {BASELINE_RELEASES.map((rel) => (
                        <li key={rel.version}>
                            <Card>
                                <CardContent className="p-5">
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                                        <p className="font-mono text-sm font-semibold text-foreground">{rel.version}</p>
                                        <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                            En vigueur le{' '}
                                            <span className="font-mono">
                                                {new Date(rel.effectiveAt).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </p>
                                    </div>
                                    <p className="mt-2 text-sm font-medium text-foreground">{rel.summary}</p>
                                    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                                        {rel.changes.map((change) => (
                                            <li key={change}>{change}</li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </li>
                    ))}
                </ol>

                <p className="mt-4 text-xs text-muted-foreground">
                    Releases publiées sur{' '}
                    <a
                        href={`${SOURCE_REPO_URL}/releases`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground underline-offset-4 hover:underline"
                    >
                        github.com/lumiris-fr/lumiris/releases
                    </a>{' '}
                    - un mirror RSS est disponible pour les agences de presse et les auditeurs.
                </p>
            </section>

            <section aria-labelledby="source-heading" className="mx-auto mt-16 max-w-3xl px-6">
                <div className="flex items-center gap-3">
                    <GithubMark className="h-5 w-5 text-foreground" />
                    <h2 id="source-heading" className="text-2xl font-semibold tracking-tight text-foreground">
                        Code source ouvert
                    </h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    L’algorithme <span className="font-mono">@lumiris/core</span> et ses datasets (coefficients carbone
                    ADEME / Higg, eau WFN, seuils ESPR) sont publics. Toute modification d’un poids ou d’un coefficient
                    passe par une pull-request signée, annoncée 90 jours avant son entrée en vigueur.
                </p>
                <a
                    href={SOURCE_REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:border-grade-a/40 mt-5 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors"
                >
                    <GithubMark className="h-4 w-4" />
                    github.com/lumiris-fr/lumiris
                </a>
            </section>

            <section className="mx-auto mt-16 max-w-3xl px-6 text-center">
                <p className="text-sm text-muted-foreground">
                    <Link href="/reglementation" className="text-foreground underline-offset-4 hover:underline">
                        Comprendre la réglementation
                    </Link>{' '}
                    ·{' '}
                    <Link
                        href="/charte-independance/saisines"
                        className="text-foreground underline-offset-4 hover:underline"
                    >
                        Saisines publiées
                    </Link>
                </p>
            </section>
        </div>
    );
}
