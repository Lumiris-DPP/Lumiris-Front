import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { getAllRegulations } from '@/lib/reglementation';

export const metadata: Metadata = {
    title: 'Réglementation - DPP, ESPR, AGEC',
    description:
        'Le passeport numérique européen (DPP), le règlement ESPR et la loi française AGEC : tout ce qu’un atelier textile doit savoir, en clair.',
    alternates: { canonical: '/reglementation' },
};

export default function ReglementationIndex() {
    const regulations = getAllRegulations();

    return (
        <div className="pt-28 pb-20">
            <header className="mx-auto mb-12 max-w-5xl px-6">
                <p className="mb-4 text-xs font-medium tracking-[0.25em] text-muted-foreground uppercase">
                    Réglementation
                </p>
                <h1 className="text-4xl font-bold tracking-tight text-balance text-foreground sm:text-5xl">
                    Comprendre AGEC, ESPR et le DPP
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground">
                    Trois textes structurent l’avenir de la consommation européenne : la loi française AGEC (2020), le
                    règlement européen ESPR (2024) et le Digital Product Passport (DPP) qui en découle. Le textile ouvre
                    la marche ; tech, batteries, électroménager et mobilier suivent entre 2027 et 2030.
                </p>
            </header>

            <section className="mx-auto max-w-5xl px-6">
                <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {regulations.map((r) => (
                        <li key={r.slug}>
                            <Link
                                href={`/reglementation/${r.slug}`}
                                className="hover:border-grade-a/40 group flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                            >
                                <div className="bg-grade-a/8 text-grade-a mb-4 inline-flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium">
                                    <BookOpen className="h-3.5 w-3.5" />
                                    Mis à jour le {new Date(r.updatedAt).toLocaleDateString('fr-FR')}
                                </div>
                                <h2 className="group-hover:text-grade-a text-lg leading-snug font-semibold text-foreground transition-colors">
                                    {r.title}
                                </h2>
                                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{r.summary}</p>
                                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                                    Lire la fiche
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
