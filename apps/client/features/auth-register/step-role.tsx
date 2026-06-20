'use client';

import { Brush, ShoppingBag, Shield, Wrench } from 'lucide-react';
import type { UserRole } from '@lumiris/types';
import { Button } from '@lumiris/ui/components/button';
import { cn } from '@lumiris/ui/lib/cn';

interface RoleOption {
    role: UserRole;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
}

const ROLES: RoleOption[] = [
    {
        role: 'artisan',
        label: 'Artisan',
        description: 'Créateur textile — créez et publiez vos passeports produit',
        icon: Brush,
    },
    {
        role: 'consumer',
        label: 'Consommateur',
        description: 'Acheteur conscient — suivez vos achats responsables',
        icon: ShoppingBag,
    },
    {
        role: 'repairer',
        label: 'Réparateur',
        description: 'Professionnel de la réparation textile — prolongez la vie des vêtements',
        icon: Wrench,
    },
    {
        role: 'admin',
        label: 'Administrateur',
        description: 'Équipe Lumiris — accès à la gestion de la plateforme',
        icon: Shield,
    },
];

interface StepRoleProps {
    selected: UserRole | null;
    onSelect: (role: UserRole) => void;
    onNext: () => void;
}

export function StepRole({ selected, onSelect, onNext }: StepRoleProps) {
    return (
        <div className="flex flex-col gap-6">
            <div className="text-center">
                <h2 className="text-foreground text-lg font-semibold">Qui êtes-vous ?</h2>
                <p className="text-muted-foreground mt-1 text-sm">Choisissez votre rôle sur la plateforme</p>
            </div>

            <div className="flex flex-col gap-3">
                {ROLES.map(({ role, label, description, icon: Icon }) => (
                    <button
                        key={role}
                        type="button"
                        onClick={() => onSelect(role)}
                        className={cn(
                            'flex items-center gap-4 rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2',
                            selected === role
                                ? 'border-lumiris-emerald bg-lumiris-emerald/5 ring-lumiris-emerald/20 ring-2'
                                : 'border-border hover:border-lumiris-emerald/40 hover:bg-muted/40',
                        )}
                    >
                        <div
                            className={cn(
                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                                selected === role ? 'bg-lumiris-emerald text-white' : 'bg-muted text-muted-foreground',
                            )}
                        >
                            <Icon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-foreground text-sm font-semibold">{label}</p>
                            <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{description}</p>
                        </div>
                    </button>
                ))}
            </div>

            <Button
                onClick={onNext}
                disabled={selected === null}
                className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 h-10 w-full text-white"
            >
                Continuer
            </Button>
        </div>
    );
}
