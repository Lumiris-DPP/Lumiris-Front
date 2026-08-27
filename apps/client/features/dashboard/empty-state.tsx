'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Check, Circle } from 'lucide-react';
import type { DashboardInfoDto } from '@lumiris/api-client';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent } from '@lumiris/ui/components/card';
import { CreatePassportCta } from '@/features/quota-upsell/create-passport-cta';

export function EmptyState({ info }: { info: DashboardInfoDto }) {
    const firstName = info.artisanName.split(' ')[0];
    const items = [
        {
            key: 'profile',
            label: 'Complétez votre profil atelier',
            helper: 'Une fiche complète rassure les acheteurs et alimente la transparence du score Iris.',
            cta: 'Compléter mon profil',
            href: '/profile',
            done: info.profileComplete,
        },
        {
            key: 'invoice',
            label: 'Ajoutez une première facture fournisseur',
            helper: 'Les factures fournisseurs justifient la composition et débloquent les fibres certifiées.',
            cta: 'Importer une facture',
            href: '/invoices',
            done: info.supplierInvoices > 0,
        },
        {
            key: 'passport',
            label: 'Créez votre premier passeport',
            helper: 'Chaque passeport est scoré en temps réel et vit comme une page consommateur.',
            cta: 'Créer mon premier passeport',
            href: '/create',
            done: false,
        },
    ];

    return (
        <Card className="mx-auto max-w-2xl">
            <CardContent className="space-y-6 p-8 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xl font-semibold text-muted-foreground">
                    {info.artisanPhotoUrl ? (
                        <Image
                            src={info.artisanPhotoUrl}
                            alt={info.artisanName}
                            width={80}
                            height={80}
                            className="h-full w-full object-cover"
                            unoptimized
                        />
                    ) : (
                        <span aria-hidden>{info.artisanName.charAt(0).toUpperCase()}</span>
                    )}
                </div>

                <div>
                    <h2 className="text-2xl font-semibold text-foreground">Bienvenue {firstName}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Trois étapes pour publier votre premier passeport vivant.
                    </p>
                </div>

                <ul className="space-y-3 text-left">
                    {items.map((item) => (
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
                                <p className="mt-1 text-xs text-muted-foreground">{item.helper}</p>
                            </div>
                            {item.key === 'passport' ? (
                                <CreatePassportCta
                                    size="sm"
                                    className="bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90"
                                >
                                    {item.cta}
                                </CreatePassportCta>
                            ) : (
                                <Button asChild size="sm" variant="outline">
                                    <Link href={item.href}>{item.cta}</Link>
                                </Button>
                            )}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
