'use client';

import Image from 'next/image';
import { ScanLine } from 'lucide-react';

export function VisionHero() {
    return (
        <section className="relative overflow-hidden pt-32 pb-16">
            {/* Subtle gradient background */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute top-1/4 right-1/4 h-96 w-96 rounded-full bg-lumiris-iris/5 blur-3xl" />
                <div className="absolute bottom-1/4 left-1/4 h-96 w-96 rounded-full bg-lumiris-cyan/5 blur-3xl" />
            </div>

            <div className="mx-auto max-w-6xl px-6">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                    {/* Left: Copy */}
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                            <ScanLine className="h-3.5 w-3.5 text-lumiris-iris" aria-hidden="true" />
                            Application mobile gratuite
                        </span>
                        <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
                            Scanner. Comprendre. Garder.
                        </h1>
                        <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                            VISION scanne n&apos;importe quel DPP européen et affiche le score Iris en temps réel. Gérez
                            votre garde-robe, suivez vos pièces, consommez en conscience.
                        </p>
                    </div>

                    {/* Right: 3 stacked phone mockups with real images */}
                    <div className="relative flex justify-center lg:justify-end">
                        <div className="relative h-[400px] w-full max-w-sm">
                            {/* Phone 1 (back) */}
                            <div className="absolute top-8 left-0 w-48 -rotate-6 rounded-[2rem] bg-foreground p-1.5 shadow-xl">
                                <div className="rounded-[1.5rem] bg-background p-2">
                                    <div className="mb-2 flex h-5 items-center justify-center rounded-full bg-muted">
                                        <div className="h-3 w-12 rounded-full bg-foreground" />
                                    </div>
                                    <div className="relative aspect-[9/16] overflow-hidden rounded-xl">
                                        <Image
                                            src="/images/product-pull.jpg"
                                            alt="Pull"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </div>
                            </div>
                            {/* Phone 2 (middle) */}
                            <div className="absolute top-4 left-1/2 w-52 -translate-x-1/2 rounded-[2rem] bg-foreground p-1.5 shadow-2xl">
                                <div className="rounded-[1.5rem] bg-background p-2">
                                    <div className="mb-2 flex h-5 items-center justify-center rounded-full bg-muted">
                                        <div className="h-3 w-12 rounded-full bg-foreground" />
                                    </div>
                                    <div className="relative aspect-[9/16] overflow-hidden rounded-xl">
                                        <Image
                                            src="/images/product-chemise.jpg"
                                            alt="Chemise"
                                            fill
                                            className="object-cover"
                                        />
                                        {/* Overlay with score */}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                                            <p className="text-xs font-medium text-white">Chemise Lin</p>
                                            <div className="mt-1 inline-flex items-center gap-1 rounded bg-lumiris-emerald px-1.5 py-0.5 text-xs font-bold text-white">
                                                A
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Phone 3 (front) */}
                            <div className="absolute top-0 right-0 w-48 rotate-6 rounded-[2rem] bg-foreground p-1.5 shadow-xl">
                                <div className="rounded-[1.5rem] bg-background p-2">
                                    <div className="mb-2 flex h-5 items-center justify-center rounded-full bg-muted">
                                        <div className="h-3 w-12 rounded-full bg-foreground" />
                                    </div>
                                    <div className="relative aspect-[9/16] overflow-hidden rounded-xl">
                                        <Image
                                            src="/images/product-veste.jpg"
                                            alt="Veste"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </div>
                            </div>
                            {/* Glow */}
                            <div className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-gradient-to-br from-lumiris-iris/10 via-transparent to-lumiris-cyan/10 blur-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
