import type { Metadata } from 'next';
import { Scale } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Conditions générales d’utilisation — LUMIRIS',
    description:
        'Règles d’usage du site lumiris.fr et conditions générales de vente des abonnements ATELIER et LOCAL. Version provisoire — à finaliser avant la mise en production publique.',
    alternates: { canonical: '/cgu' },
};

const LAST_REVIEWED = '2026-05-15';

export default function CguPage() {
    return (
        <main className="min-h-screen bg-background pt-28 pb-24">
            <header className="mx-auto max-w-3xl px-6">
                <div className="flex items-center gap-3">
                    <Scale className="text-grade-c h-6 w-6" aria-hidden="true" />
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                        Conditions générales (CGU / CGV)
                    </h1>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                    Version provisoire — à finaliser avant la mise en production publique. Dernière revue&nbsp;:{' '}
                    <span className="font-mono text-foreground">
                        {new Date(LAST_REVIEWED).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </span>
                    .
                </p>
            </header>

            <section className="mx-auto mt-10 max-w-3xl space-y-8 px-6 text-sm leading-relaxed">
                <div>
                    <h2 className="text-base font-semibold text-foreground">Objet</h2>
                    <p className="mt-2 text-muted-foreground">
                        Les présentes conditions encadrent l&apos;usage du site lumiris.fr et la souscription aux offres
                        LUMIRIS — ATELIER (abonnements artisans), ATELIER+ (add-on), LOCAL (retoucheurs) et l&apos;API
                        Enterprise pour les marques. Le détail tarifaire et les modalités d&apos;engagement seront
                        publiés ici avant l&apos;ouverture commerciale.
                    </p>
                </div>

                <div>
                    <h2 className="text-base font-semibold text-foreground">Propriété intellectuelle</h2>
                    <p className="mt-2 text-muted-foreground">
                        Le code source de l&apos;algorithme de scoring Iris (40 / 25 / 25 / 10) est public et auditable
                        (cf.{' '}
                        <a href="/charte-independance" className="text-foreground underline-offset-4 hover:underline">
                            Charte d&apos;indépendance
                        </a>
                        ). Les contenus éditoriaux, marques et illustrations restent la propriété de LUMIRIS et ne
                        peuvent être reproduits sans autorisation.
                    </p>
                </div>

                <div>
                    <h2 className="text-base font-semibold text-foreground">Responsabilité</h2>
                    <p className="mt-2 text-muted-foreground">
                        Les passeports DPP affichés sur lumiris.fr sont publiés sous la responsabilité de l&apos;artisan
                        émetteur. LUMIRIS contrôle la cohérence algorithmique du score Iris mais ne se substitue pas à
                        l&apos;artisan dans la véracité des données déclaratives (origine, certifications, composition).
                    </p>
                </div>

                <div>
                    <h2 className="text-base font-semibold text-foreground">Contact</h2>
                    <p className="mt-2 text-muted-foreground">
                        Pour toute question relative aux CGU / CGV&nbsp;:{' '}
                        <a
                            href="mailto:legal@lumiris.fr"
                            className="text-foreground underline-offset-4 hover:underline"
                        >
                            legal@lumiris.fr
                        </a>
                        .
                    </p>
                </div>
            </section>
        </main>
    );
}
