import type { PayoutExpectation } from './seller';

// Vocabulaire FR de la trésorerie vendeur, collé à l'union qu'il indexe : une valeur ajoutée côté
// backend casse le build ici plutôt que d'afficher une ligne muette.
export const PAYOUT_EXPECTATION_LABEL: Record<PayoutExpectation, string> = {
    SCHEDULED: 'Attendu',
    IMMINENT: 'Versement en cours',
    ON_HOLD: 'Suspendu',
};

export const PAYOUT_EXPECTATION_HINT: Record<PayoutExpectation, string> = {
    SCHEDULED: 'à la livraison de la commande',
    IMMINENT: 'le virement part sous 24 h',
    ON_HOLD: 'le versement reprend après résolution',
};
