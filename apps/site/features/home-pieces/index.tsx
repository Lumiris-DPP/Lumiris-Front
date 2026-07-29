'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { IrisGrade } from '@lumiris/scoring-ui/components/iris-grade';

const FEATURED_PIECES = [
    {
        id: '1',
        name: 'Chemise Lin Naturel',
        artisan: 'Marie Le Goff',
        grade: 'A' as const,
        image: '/images/product-chemise.jpg',
        ref: 'CHE-NAB-001',
    },
    {
        id: '2',
        name: 'Pull Mérinos',
        artisan: 'Amélie Barthier',
        grade: 'A' as const,
        image: '/images/product-pull.jpg',
        ref: 'BIO-AME-001',
    },
    {
        id: '3',
        name: 'Veste Artisanale',
        artisan: 'Paul Chevreau',
        grade: 'B' as const,
        image: '/images/product-veste.jpg',
        ref: 'PORT-PAU-001',
    },
    {
        id: '4',
        name: 'Robe Lin Été',
        artisan: 'Maison Lumière',
        grade: 'A' as const,
        image: '/images/product-robe.jpg',
        ref: 'VES-LAU-001',
    },
];

export function HomePieces() {
    return (
        <section className="py-24 sm:py-32">
            <div className="mx-auto max-w-6xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5 }}
                    className="flex items-end justify-between gap-4"
                >
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                            Pièces publiées
                        </h2>
                        <p className="mt-2 text-lg text-muted-foreground">
                            Découvrez les créations traçées par nos artisans partenaires.
                        </p>
                    </div>
                    <Link
                        href="/decouvrir"
                        className="hidden items-center gap-1 text-sm font-medium text-lumiris-cyan transition-colors hover:text-lumiris-cyan/80 sm:inline-flex"
                    >
                        Tout voir
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </motion.div>

                {/* Grid of pieces */}
                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {FEATURED_PIECES.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.4, delay: index * 0.08 }}
                        >
                            <Link href={`/passeport/${item.id}`} className="group block">
                                <div className="overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-lg">
                                    <div className="relative aspect-[4/5]">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                        {/* IrisGrade overlay */}
                                        <div className="absolute top-3 left-3">
                                            <IrisGrade grade={item.grade} size="sm" />
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            {item.artisan}
                                        </p>
                                        <p className="mt-1 font-medium text-foreground">{item.name}</p>
                                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{item.ref}</p>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Mobile "Tout voir" link */}
                <div className="mt-8 text-center sm:hidden">
                    <Link
                        href="/decouvrir"
                        className="inline-flex items-center gap-1 text-sm font-medium text-lumiris-cyan transition-colors hover:text-lumiris-cyan/80"
                    >
                        Tout voir
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
