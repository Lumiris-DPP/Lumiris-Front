'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Check, Circle } from 'lucide-react';
import type { Artisan } from '@lumiris/types';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent } from '@lumiris/ui/components/card';
import { CreatePassportCta } from '@/features/quota-upsell/create-passport-cta';
import type { OnboardingItem } from './derive';

interface EmptyStateProps {
    artisan: Artisan;
    items: readonly OnboardingItem[];
}

const HELPERS: Record<OnboardingItem['key'], string> = {
    profile: 'Une fiche complète rassure les acheteurs et alimente la transparence du score Iris.',
    invoice: 'Les factures fournisseurs justifient la composition et débloquent les fibres certifiées.',
    passport: 'Chaque passeport est scoré en temps réel et vit comme une page consommateur.',
};

const CTAS: Record<OnboardingItem['key'], string> = {
    profile: 'Compléter mon profil',
    invoice: 'Importer une facture',
    passport: 'Créer mon premier passeport',
};

export function EmptyState({ artisan, items }: EmptyStateProps) {
    const firstName = artisan.displayName.split(' ')[0];
    return (
        <Card className="mx-auto max-w-2xl">
            <CardContent className="space-y-6 p-8 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xl font-semibold text-muted-foreground">
                    {artisan.photoUrl ? (
                        <Image
                            src={artisan.photoUrl}
                            alt={artisan.displayName}
                            width={80}
                            height={80}
                            className="h-full w-full object-cover"
                            unoptimized
                        />
                    ) : (
                        <span aria-hidden>{artisan.displayName.charAt(0).toUpperCase()}</span>
                    )}
                </div>

                <div>
                    <h2 className="text-2xl font-semibold text-foreground">Bienvenue {firstName}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Trois étapes pour publier votre premier passeport vivant.
                    </p>
                </div>

                <ul className="space-y-3 text-left">
                    {items.map((item) => {
                        const isPrimary = item.key === 'passport';
                        return (
                            <li key={item.key} className="flex items-start gap-4 rounded-lg border border-border p-4">
                                <div className="mt-0.5">
                                    {item.done ? (
                                        <Check className="h-5 w-5 text-lumiris-emerald" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{HELPERS[item.key]}</p>
                                </div>
                                {isPrimary ? (
                                    <CreatePassportCta
                                        size="sm"
                                        className="bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90"
                                    >
                                        {CTAS[item.key]}
                                    </CreatePassportCta>
                                ) : (
                                    <Button asChild size="sm" variant="outline">
                                        <Link href={item.href}>{CTAS[item.key]}</Link>
                                    </Button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </CardContent>
        </Card>
    );
}
