'use client';

import Image from 'next/image';
import { ScanLine } from 'lucide-react';

export function VisionHero() {
    return (
        <section className="relative overflow-hidden pb-16 pt-32">
            {/* Subtle gradient background */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute right-1/4 top-1/4 h-96 w-96 rounded-full bg-violet-500/5 blur-3xl" />
                <div className="absolute bottom-1/4 left-1/4 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />
            </div>

            <div className="mx-auto max-w-6xl px-6">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                    {/* Left: Copy */}
                    <div>
                        <span className="border-border bg-card text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
                            <ScanLine className="h-3.5 w-3.5 text-violet-500" aria-hidden="true" />
                            Application mobile gratuite
                        </span>
                        <h1 className="text-foreground mt-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                            Scanner. Comprendre. Garder.
                        </h1>
                        <p className="text-muted-foreground mt-6 max-w-lg text-lg leading-relaxed">
                            VISION scanne n&apos;importe quel DPP européen et affiche le score Iris en temps réel. Gérez
                            votre garde-robe, suivez vos pièces, consommez en conscience.
                        </p>
                    </div>

                    {/* Right: 3 stacked phone mockups with real images */}
                    <div className="relative flex justify-center lg:justify-end">
                        <div className="relative h-[400px] w-full max-w-sm">
                            {/* Phone 1 (back) */}
                            <div className="bg-foreground absolute left-0 top-8 w-48 -rotate-6 rounded-[2rem] p-1.5 shadow-xl">
                                <div className="bg-background rounded-[1.5rem] p-2">
                                    <div className="bg-muted mb-2 flex h-5 items-center justify-center rounded-full">
                                        <div className="bg-foreground h-3 w-12 rounded-full" />
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
                            <div className="bg-foreground absolute left-1/2 top-4 w-52 -translate-x-1/2 rounded-[2rem] p-1.5 shadow-2xl">
                                <div className="bg-background rounded-[1.5rem] p-2">
                                    <div className="bg-muted mb-2 flex h-5 items-center justify-center rounded-full">
                                        <div className="bg-foreground h-3 w-12 rounded-full" />
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
                                            <div className="mt-1 inline-flex items-center gap-1 rounded bg-emerald-500 px-1.5 py-0.5 text-xs font-bold text-white">
                                                A
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Phone 3 (front) */}
                            <div className="bg-foreground absolute right-0 top-0 w-48 rotate-6 rounded-[2rem] p-1.5 shadow-xl">
                                <div className="bg-background rounded-[1.5rem] p-2">
                                    <div className="bg-muted mb-2 flex h-5 items-center justify-center rounded-full">
                                        <div className="bg-foreground h-3 w-12 rounded-full" />
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
                            <div className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 blur-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
