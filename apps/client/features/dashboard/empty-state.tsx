'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Check, Circle } from 'lucide-react';
import type { Artisan } from '@lumiris/types';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent } from '@lumiris/ui/components/card';
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
                <div className="border-border bg-muted text-muted-foreground mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border text-xl font-semibold">
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
                    <h2 className="text-foreground text-2xl font-semibold">Bienvenue {firstName}</h2>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Trois étapes pour publier votre premier passeport vivant.
                    </p>
                </div>

                <ul className="space-y-3 text-left">
                    {items.map((item) => {
                        const isPrimary = item.key === 'passport';
                        return (
                            <li key={item.key} className="border-border flex items-start gap-4 rounded-lg border p-4">
                                <div className="mt-0.5">
                                    {item.done ? (
                                        <Check className="text-lumiris-emerald h-5 w-5" />
                                    ) : (
                                        <Circle className="text-muted-foreground h-5 w-5" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-foreground text-sm font-medium">{item.label}</p>
                                    <p className="text-muted-foreground mt-1 text-xs">{HELPERS[item.key]}</p>
                                </div>
                                <Button
                                    asChild
                                    size="sm"
                                    variant={isPrimary ? 'default' : 'outline'}
                                    className={
                                        isPrimary
                                            ? 'bg-lumiris-cyan hover:bg-lumiris-cyan/90 text-white'
                                            : undefined
                                    }
                                >
                                    <Link href={item.href}>{CTAS[item.key]}</Link>
                                </Button>
                            </li>
                        );
                    })}
                </ul>
            </CardContent>
        </Card>
    );
}
