import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, FileText, XCircle } from 'lucide-react';
import { Badge } from '@lumiris/ui/components/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';

export const metadata: Metadata = {
    title: 'Saisines de la commission - Charte d’indépendance LUMIRIS',
    description:
        'Toutes les saisines reçues par la commission d’indépendance LUMIRIS et leurs décisions, publiées intégralement.',
    alternates: { canonical: '/charte-independance/saisines' },
};

type SaisineDecision = 'rejetee' | 'fondee' | 'partiellement-fondee';

interface Saisine {
    id: string;
    receivedAt: string;
    decidedAt: string;
    plaignant: 'consommateur' | 'artisan' | 'journaliste' | 'concurrent';
    subject: string;
    summary: string;
    decision: SaisineDecision;
    rationale: string;
    actionsTaken: readonly string[];
}

const DECISION_LABEL: Record<SaisineDecision, string> = {
    rejetee: 'Rejetée',
    fondee: 'Fondée',
    'partiellement-fondee': 'Partiellement fondée',
};

const PLAIGNANT_LABEL: Record<Saisine['plaignant'], string> = {
    consommateur: 'Consommateur',
    artisan: 'Artisan référencé',
    journaliste: 'Journaliste',
    concurrent: 'Concurrent',
};

// TODO(saisines-réelles) : remplacer ce tableau par un fetch vers commission@lumiris.fr dès la première saisine réelle.
const SAISINES: readonly Saisine[] = [
    {
        id: 'SAI-2026-001',
        receivedAt: '2026-03-04',
        decidedAt: '2026-03-21',
        plaignant: 'concurrent',
        subject: 'Allégation : score Iris de l’atelier Berthier influencé par son adhésion ATELIER+',
        summary:
            'Un acteur concurrent estime que le score A obtenu par l’atelier Berthier est lié à sa souscription ATELIER+ (39 €/mois) plutôt qu’à la qualité réelle du passeport.',
        decision: 'rejetee',
        rationale:
            'L’audit du code @lumiris/core et le rejouage déterministe du passeport sur le commit du jour produisent le même score sans tenir compte de la valeur de Artisan.plus. La commission a vérifié que ATELIER+ n’apparaît dans aucun coefficient du scoring.',
        actionsTaken: [
            'Publication du rejouage déterministe du passeport (commit 86d2401)',
            'Ajout d’un test de régression interdisant toute lecture de Artisan.plus dans le module @lumiris/core/scoring',
        ],
    },
    {
        id: 'SAI-2026-002',
        receivedAt: '2026-03-18',
        decidedAt: '2026-04-09',
        plaignant: 'consommateur',
        subject: 'Demande : passeport publié sans photo des étapes de fabrication',
        summary:
            'Un consommateur signale qu’un passeport au statut Published (référence CHE-2026-014) n’a aucune photo sur ses 3 étapes de fabrication. Le score affiché est néanmoins B.',
        decision: 'partiellement-fondee',
        rationale:
            'Les photos d’étapes alimentent le sous-score Transparence à hauteur de 8 points. La commission constate que l’absence de photos n’est pas un champ ESPR obligatoire et n’active donc pas le plafond D - mais le score Transparence aurait dû être plus bas. Investigation : un cache de calcul du sous-score n’avait pas été invalidé après la suppression des photos.',
        actionsTaken: [
            'Recalcul forcé du score sur le passeport CHE-2026-014 (passé de B à C)',
            'Patch publié dans @lumiris/core 0.4.2 - invalidation systématique du cache au moindre champ modifié',
            'Audit des 1 200 passeports actifs : 7 autres cas équivalents recalculés',
        ],
    },
    {
        id: 'SAI-2026-003',
        receivedAt: '2026-04-12',
        decidedAt: '2026-04-26',
        plaignant: 'journaliste',
        subject: 'Demande : justifier les coefficients eau Coton et Cachemire',
        summary:
            'Un journaliste de Reporterre demande la source précise des coefficients eau de FIBER_WATER_COEFFICIENTS pour le coton (8 000 L/kg) et le cachemire (6 500 L/kg).',
        decision: 'fondee',
        rationale:
            'La commission constate que la source était documentée en commentaire de @lumiris/core/constants.ts mais sans lien public ni date d’extraction. Demande légitime de traçabilité.',
        actionsTaken: [
            'Publication d’un dataset versionné public (lumiris-fr/datasets#1) avec les sources, les dates d’extraction et les marges d’incertitude',
            'Lien dans le footer LUMIRIS vers le dataset depuis le 1ᵉʳ mai 2026',
            'Engagement à publier toute mise à jour de coefficient avec un préavis de 90 jours',
        ],
    },
];

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

function DecisionBadge({ decision }: { decision: SaisineDecision }) {
    const styles: Record<SaisineDecision, string> = {
        rejetee: 'border-grade-d/40 bg-grade-d/5 text-grade-d',
        fondee: 'border-grade-a/40 bg-grade-a/5 text-grade-a',
        'partiellement-fondee': 'border-grade-c/40 bg-grade-c/5 text-grade-c',
    };
    const Icon = decision === 'rejetee' ? XCircle : CheckCircle2;
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${styles[decision]}`}
        >
            <Icon className="h-3 w-3" />
            {DECISION_LABEL[decision]}
        </span>
    );
}

export default function SaisinesPage() {
    return (
        <div className="pb-20 pt-28">
            <header className="mx-auto max-w-3xl px-6">
                <Link
                    href="/charte-independance"
                    className="text-muted-foreground hover:text-foreground inline-flex items-center text-xs"
                >
                    ← Charte d’indépendance
                </Link>
                <div className="mt-6 flex items-center gap-3">
                    <FileText className="text-grade-b h-7 w-7" />
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.25em]">
                        Saisines de la commission
                    </p>
                </div>
                <h1 className="text-foreground mt-3 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
                    Toutes les saisines reçues sont publiées.
                </h1>
                <p className="text-muted-foreground mt-5 text-pretty text-base leading-relaxed">
                    Cette page liste l’intégralité des saisines reçues par la commission d’indépendance LUMIRIS - date,
                    plaignant, décision motivée, actions correctives. Aucune saisine n’est filtrée. Une saisine en cours
                    apparaît dès sa réception ; sa décision est publiée sous 30 jours maximum.
                </p>
            </header>

            <section aria-labelledby="saisines-list-heading" className="mx-auto mt-12 max-w-3xl px-6">
                <h2 id="saisines-list-heading" className="sr-only">
                    Liste des saisines
                </h2>
                <ol className="space-y-5">
                    {SAISINES.map((s) => (
                        <li key={s.id}>
                            <Card>
                                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-muted-foreground font-mono text-xs">{s.id}</p>
                                        <CardTitle className="mt-1 text-base font-semibold leading-snug">
                                            {s.subject}
                                        </CardTitle>
                                        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-xs">
                                            <Badge variant="outline" className="text-[11px]">
                                                {PLAIGNANT_LABEL[s.plaignant]}
                                            </Badge>
                                            <span>·</span>
                                            <span>Reçue le {DATE_FMT.format(new Date(s.receivedAt))}</span>
                                            <span>·</span>
                                            <span>Décidée le {DATE_FMT.format(new Date(s.decidedAt))}</span>
                                        </div>
                                    </div>
                                    <DecisionBadge decision={s.decision} />
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-foreground text-xs font-semibold uppercase tracking-wide">
                                            Résumé
                                        </p>
                                        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                                            {s.summary}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-foreground text-xs font-semibold uppercase tracking-wide">
                                            Décision motivée
                                        </p>
                                        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                                            {s.rationale}
                                        </p>
                                    </div>
                                    {s.actionsTaken.length > 0 && (
                                        <div>
                                            <p className="text-foreground text-xs font-semibold uppercase tracking-wide">
                                                Actions correctives
                                            </p>
                                            <ul className="text-muted-foreground mt-2 space-y-1 text-sm leading-relaxed">
                                                {s.actionsTaken.map((a, idx) => (
                                                    <li key={idx} className="flex gap-2">
                                                        <span className="text-grade-a/80 mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-current" />
                                                        <span>{a}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </li>
                    ))}
                </ol>
            </section>

            <section className="mx-auto mt-12 max-w-3xl px-6 text-center">
                <p className="text-muted-foreground text-sm">
                    Une saisine ?{' '}
                    <a
                        href="mailto:commission@lumiris.fr"
                        className="text-foreground underline-offset-4 hover:underline"
                    >
                        commission@lumiris.fr
                    </a>{' '}
                    · Décision rendue publique sous 30 jours maximum.
                </p>
            </section>
        </div>
    );
}
