import type { Metadata } from 'next';
import { FileText } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Mentions légales — LUMIRIS',
    description:
        'Éditeur, hébergeur et contact responsable de la publication du site lumiris.fr. Version provisoire — à compléter avant la mise en production publique.',
    alternates: { canonical: '/mentions-legales' },
};

const LAST_REVIEWED = '2026-05-15';

export default function MentionsLegalesPage() {
    return (
        <main className="min-h-screen bg-background pt-28 pb-24">
            <header className="mx-auto max-w-3xl px-6">
                <div className="flex items-center gap-3">
                    <FileText className="text-grade-b h-6 w-6" aria-hidden="true" />
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                        Mentions légales
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
                    <h2 className="text-base font-semibold text-foreground">Éditeur</h2>
                    <p className="mt-2 text-muted-foreground">
                        LUMIRIS — entité éditrice du site et du passeport numérique du textile artisanal français.
                        Coordonnées complètes (raison sociale, SIRET, capital social, siège) en cours de finalisation
                        avant le lancement commercial.
                    </p>
                </div>

                <div>
                    <h2 className="text-base font-semibold text-foreground">Directeur de la publication</h2>
                    <p className="mt-2 text-muted-foreground">
                        Le responsable légal de la publication sera désigné nommément ici lors de la mise en production.
                    </p>
                </div>

                <div>
                    <h2 className="text-base font-semibold text-foreground">Hébergement</h2>
                    <p className="mt-2 text-muted-foreground">
                        Le site est servi via une infrastructure d&apos;hébergement en cours d&apos;arbitrage (Vercel,
                        Scaleway ou OVHcloud). L&apos;hébergeur retenu sera publié ici, avec son adresse et ses
                        coordonnées de contact, dès la mise en production.
                    </p>
                </div>

                <div>
                    <h2 className="text-base font-semibold text-foreground">Contact</h2>
                    <p className="mt-2 text-muted-foreground">
                        Pour toute question relative aux mentions légales&nbsp;:{' '}
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
