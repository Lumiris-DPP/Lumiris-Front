export const CACHE_TIMES = {
    STATIC: 30 * 60 * 1000,
    LIST: 2 * 60 * 1000,
    DETAIL: 5 * 60 * 1000,
    REALTIME: 30 * 1000,
    // Écran où deux personnes s'écrivent et attendent une réponse : la latence perçue compte
    // plus que le coût des requêtes. React Query suspend l'intervalle quand l'onglet passe en
    // arrière-plan et refetch au retour au premier plan — on ne paie que le temps d'attention réel.
    CONVERSATION: 10 * 1000,
} as const;

export type QueryPreset = 'list' | 'detail' | 'static' | 'realtime';
