'use client';

import { useMemo } from 'react';
import { mockPassports } from '@lumiris/mock-data';
import { useUser } from '@/lib/auth/use-user';
import { useWardrobe } from '@/lib/wardrobe-storage';

// Reco perso (LUMIRIS-9) : pour un utilisateur connecté, les catégories des pièces
// Lumiris qu'il possède dans son vault servent de signal d'affinité envoyé au backend
// (param `personalize`). Non connecté ou vault vide → aucune personnalisation.
export function useAffinityCategories(): string[] {
    const { isAuthenticated } = useUser();
    const wardrobe = useWardrobe();

    return useMemo(() => {
        if (!isAuthenticated) return [];
        const categories = new Set<string>();
        for (const item of wardrobe) {
            if (item.kind === 'lumiris-passport') {
                const passport = mockPassports.find((p) => p.id === item.passportId);
                if (passport) categories.add(passport.garment.kind);
            }
        }
        return [...categories];
    }, [isAuthenticated, wardrobe]);
}
