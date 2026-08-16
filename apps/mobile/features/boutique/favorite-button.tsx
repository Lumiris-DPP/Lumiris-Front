'use client';

import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { useFavorites, useToggleFavorite } from '@lumiris/api-client/react';
import { cn } from '@lumiris/ui/lib/cn';
import { useUser } from '@/lib/auth/use-user';
import type { MarketplaceItem } from '@/lib/marketplace';
import { routes } from '@/lib/routes';
import { toast } from '@/lib/toast';

interface FavoriteButtonProps {
    item: MarketplaceItem;
    className?: string;
}

// Un seul composant pour la carte et la fiche : la position et l'échelle passent par className,
// pas par une prop de variante qui n'aurait qu'un cas.
export function FavoriteButton({ item, className }: FavoriteButtonProps) {
    const router = useRouter();
    const { isAuthenticated } = useUser();
    const { data: favorites = [] } = useFavorites({ enabled: isAuthenticated });
    const toggle = useToggleFavorite();
    const isFavorite = favorites.some((favorite) => favorite.id === item.id);

    // On ne laisse jamais partir un 401 : la couche HTTP effacerait la session stockée.
    const onClick = () => {
        if (!isAuthenticated) {
            toast('Connecte-toi pour garder cette pièce en favori', {
                action: {
                    label: 'Se connecter',
                    onClick: () => router.push(`/auth/sign-in?returnTo=${encodeURIComponent(routes.product(item.id))}`),
                },
            });
            return;
        }
        toggle.mutate(
            { item: item.source, favorite: !isFavorite },
            { onError: () => toast.error('Impossible de mettre à jour tes favoris.') },
        );
    };

    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? `Retirer ${item.name} des favoris` : `Ajouter ${item.name} aux favoris`}
            className={cn(
                'inline-flex items-center justify-center rounded-full border border-border bg-card/90 text-foreground backdrop-blur transition-colors',
                isFavorite && 'border-lumiris-rose/40 bg-lumiris-rose/15 text-lumiris-rose',
                className,
            )}
        >
            <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} strokeWidth={1.5} aria-hidden />
        </button>
    );
}
