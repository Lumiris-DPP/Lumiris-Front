'use client';

import { Brush, Wrench } from 'lucide-react';
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
        role: 'repairer',
        label: 'Réparateur',
        description: 'Professionnel de la réparation textile — prolongez la vie des vêtements',
        icon: Wrench,
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
                <h2 className="text-lg font-semibold text-foreground">Qui êtes-vous ?</h2>
                <p className="mt-1 text-sm text-muted-foreground">Choisissez votre rôle sur la plateforme</p>
            </div>

            <div className="flex flex-col gap-3">
                {ROLES.map(({ role, label, description, icon: Icon }) => (
                    <button
                        key={role}
                        type="button"
                        onClick={() => onSelect(role)}
                        className={cn(
                            'flex items-center gap-4 rounded-xl border p-4 text-left transition-all focus-visible:ring-2 focus-visible:outline-none',
                            selected === role
                                ? 'border-lumiris-cyan bg-lumiris-cyan/5 ring-2 ring-lumiris-cyan/20'
                                : 'border-border hover:border-lumiris-cyan/40 hover:bg-muted/40',
                        )}
                    >
                        <div
                            className={cn(
                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                                selected === role ? 'bg-lumiris-cyan text-white' : 'bg-muted text-muted-foreground',
                            )}
                        >
                            <Icon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">{label}</p>
                            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
                        </div>
                    </button>
                ))}
            </div>

            <Button
                onClick={onNext}
                disabled={selected === null}
                className="h-10 w-full bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90"
            >
                Continuer
            </Button>
        </div>
    );
}
