import { Favorites } from '@/features/favorites';

// Liste d'envies de l'acheteur (GET /api/marketplace/favorites) — et destinataire des alertes de
// rupture imminente et de baisse de prix.
export default function MeFavoritesPage() {
    return <Favorites />;
}
