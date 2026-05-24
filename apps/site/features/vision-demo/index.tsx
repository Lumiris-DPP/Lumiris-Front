'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ScanLine, BarChart3, Shirt } from 'lucide-react';

const DEMO_TABS = [
    {
        id: 'scan',
        label: 'Scanner',
        icon: ScanLine,
        description: "Scannez n'importe quel DPP en un instant",
    },
    {
        id: 'score',
        label: 'Score Iris',
        icon: BarChart3,
        description: 'Visualisez le score Iris détaillé',
    },
    {
        id: 'wardrobe',
        label: 'Garde-Robe',
        icon: Shirt,
        description: 'Gérez votre collection de pièces',
    },
] as const;

export function VisionDemo() {
    const [activeTab, setActiveTab] = useState<'scan' | 'score' | 'wardrobe'>('scan');

    return (
        <section className="bg-muted/30 py-20 sm:py-28">
            <div className="mx-auto max-w-6xl px-6">
                <div className="mb-12 text-center">
                    <span className="inline-block rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-violet-600">
                        Demo
                    </span>
                    <h2 className="text-foreground mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                        L&apos;expérience VISION
                    </h2>
                    <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
                        Découvrez les fonctionnalités clés de l&apos;application.
                    </p>
                </div>

                <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                    {/* Vertical tabs */}
                    <div className="order-2 lg:order-1">
                        <div className="space-y-3">
                            {DEMO_TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    aria-label={`Voir la démo ${tab.label}`}
                                    aria-pressed={activeTab === tab.id}
                                    className={`flex w-full items-center gap-4 rounded-xl p-4 text-left transition-all ${
                                        activeTab === tab.id
                                            ? 'bg-card border-2 border-violet-500/30 shadow-md'
                                            : 'hover:bg-card/50 border-2 border-transparent'
                                    }`}
                                >
                                    <div
                                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                                            activeTab === tab.id ? 'bg-violet-500/10' : 'bg-muted'
                                        }`}
                                    >
                                        <tab.icon
                                            className={`h-6 w-6 ${
                                                activeTab === tab.id ? 'text-violet-600' : 'text-muted-foreground'
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <p
                                            className={`font-semibold ${
                                                activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground'
                                            }`}
                                        >
                                            {tab.label}
                                        </p>
                                        <p className="text-muted-foreground text-sm">{tab.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Phone mockup */}
                    <div className="order-1 flex justify-center lg:order-2">
                        <div className="relative">
                            <div className="bg-foreground w-64 rounded-[2.5rem] p-2 shadow-2xl sm:w-72">
                                <div className="bg-background overflow-hidden rounded-[2rem]">
                                    {/* Status bar */}
                                    <div className="bg-card flex items-center justify-center py-2">
                                        <div className="bg-foreground h-6 w-24 rounded-full" />
                                    </div>

                                    {/* Screen content */}
                                    <div className="aspect-[9/16] p-4">
                                        {activeTab === 'scan' && (
                                            <div className="flex h-full flex-col items-center justify-center">
                                                <div className="bg-muted relative h-48 w-48 rounded-2xl">
                                                    <div className="absolute inset-4 rounded-lg border-2 border-dashed border-violet-500" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <ScanLine className="h-12 w-12 text-violet-500" />
                                                    </div>
                                                </div>
                                                <p className="text-muted-foreground mt-4 text-center text-sm">
                                                    Placez le QR code dans le cadre
                                                </p>
                                            </div>
                                        )}

                                        {activeTab === 'score' && (
                                            <div className="h-full">
                                                <div className="mb-4 flex items-center gap-3">
                                                    <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                                                        <Image
                                                            src="/images/product-chemise.jpg"
                                                            alt="Chemise"
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-foreground text-sm font-medium">
                                                            Chemise Lin
                                                        </p>
                                                        <p className="text-muted-foreground text-xs">Atelier Margaux</p>
                                                    </div>
                                                    <span className="rounded bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white">
                                                        A
                                                    </span>
                                                </div>
                                                <div className="space-y-3">
                                                    {[
                                                        { label: 'Matière', value: 85, color: 'bg-cyan-500' },
                                                        { label: 'Fabrication', value: 78, color: 'bg-violet-500' },
                                                        { label: 'Durabilité', value: 92, color: 'bg-emerald-500' },
                                                        { label: 'Social', value: 88, color: 'bg-amber-500' },
                                                    ].map((item) => (
                                                        <div key={item.label}>
                                                            <div className="mb-1 flex justify-between text-xs">
                                                                <span className="text-muted-foreground">
                                                                    {item.label}
                                                                </span>
                                                                <span className="text-foreground font-medium">
                                                                    {item.value}
                                                                </span>
                                                            </div>
                                                            <div className="bg-muted h-2 overflow-hidden rounded-full">
                                                                <div
                                                                    className={`h-full rounded-full ${item.color}`}
                                                                    style={{ width: `${item.value}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'wardrobe' && (
                                            <div className="h-full">
                                                <p className="text-foreground mb-3 font-medium">Ma Garde-Robe</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[
                                                        '/images/product-chemise.jpg',
                                                        '/images/product-pull.jpg',
                                                        '/images/product-veste.jpg',
                                                        '/images/product-robe.jpg',
                                                    ].map((src, i) => (
                                                        <div
                                                            key={i}
                                                            className="relative aspect-square overflow-hidden rounded-lg"
                                                        >
                                                            <Image
                                                                src={src}
                                                                alt={`Piece ${i + 1}`}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-muted-foreground mt-3 text-center text-xs">
                                                    4 pièces enregistrées
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Decorative glow */}
                            <div className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 blur-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
