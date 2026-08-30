'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from './push';

// Enregistre le service worker au chargement de l'app, indépendamment de l'opt-in : ça ne
// déclenche aucune invite de permission, juste la préparation nécessaire à PushManager.subscribe()
// depuis /me/settings.
export function PushRegistrationBridge() {
    useEffect(() => {
        void registerServiceWorker();
    }, []);
    return null;
}
