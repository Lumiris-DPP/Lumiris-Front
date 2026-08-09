// Les écrans dont l'identifiant n'existe qu'à l'exécution (code public d'un DPP, slug artisan,
// produit, commande) passent par une query string : l'app est exportée en statique
// (`output: 'export'`), donc seuls les segments dynamiques énumérables au build sont pré-rendus.
// Slash final : `trailingSlash: true` côté Next, donc l'URL pointe directement sur le fichier
// exporté (`out/p/index.html`) — pas de redirection intermédiaire.
function withParams(pathname: string, params: Record<string, string | null | undefined>): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value) search.set(key, value);
    }
    const query = search.toString();
    return query ? `${pathname}/?${query}` : `${pathname}/`;
}

export const routes = {
    publicPassport: (code: string, accessToken?: string | null): string =>
        withParams('/p', { c: code, k: accessToken }),
    artisan: (slug: string): string => withParams('/artisans', { slug }),
    product: (id: string): string => withParams('/boutique/produit', { id }),
    order: (paymentIntentId: string): string => withParams('/commande', { pi: paymentIntentId }),
    orderTracking: (orderId: string): string => withParams('/commande/suivi', { id: orderId }),
    orderInvoice: (paymentIntentId: string): string => withParams('/commande/facture', { pi: paymentIntentId }),
} as const;
