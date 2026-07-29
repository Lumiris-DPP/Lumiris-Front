import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllRegulations, getRegulationBySlug } from '@/lib/reglementation';

export const dynamicParams = false;

export function generateStaticParams() {
    return getAllRegulations().map((r) => ({ slug: r.slug }));
}

interface RouteProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
    const { slug } = await params;
    const reg = getRegulationBySlug(slug);
    if (!reg) return {};

    const description = reg.summary.length > 160 ? `${reg.summary.slice(0, 157).trimEnd()}…` : reg.summary;
    const canonical = `/reglementation/${reg.slug}`;

    return {
        title: reg.title,
        description,
        alternates: { canonical },
        openGraph: {
            type: 'article',
            url: canonical,
            title: reg.title,
            description,
        },
        twitter: {
            card: 'summary_large_image',
            title: reg.title,
            description,
        },
    };
}

export default async function RegulationPage({ params }: RouteProps) {
    const { slug } = await params;
    const reg = getRegulationBySlug(slug);
    if (!reg) notFound();

    const Body = reg.Component;

    return (
        <article className="pt-28 pb-20">
            <header className="mx-auto max-w-3xl px-6">
                <Link
                    href="/reglementation"
                    className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
                >
                    ← Toutes les fiches
                </Link>
                <p className="mt-6 text-xs font-medium tracking-[0.25em] text-muted-foreground uppercase">
                    Réglementation · Mis à jour le {new Date(reg.updatedAt).toLocaleDateString('fr-FR')}
                </p>
            </header>

            <section className="mx-auto mt-6 max-w-3xl px-6">
                <Body />
            </section>
        </article>
    );
}
