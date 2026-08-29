'use client';

import { useCallback, useEffect, useState } from 'react';
import { useVapidPublicKey, usePushSubscribe, usePushUnsubscribe } from '@lumiris/api-client/react';
import type { PushSubscriptionPayload } from '@lumiris/api-client';
import { getExistingPushSubscription, isPushSupported, subscribeToPush } from '@/lib/push';

export type PushOptInStatus = 'unsupported' | 'unavailable' | 'denied' | 'off' | 'on';

// unsupported: navigateur sans Service Worker/Push API (ex. Safari iOS < 16.4, ou Tauri webview).
// unavailable: VAPID non configuré côté back — rien à quoi s'abonner.
// denied: l'utilisateur a bloqué les notifications au niveau du navigateur, aucun opt-in possible
// depuis l'app tant qu'il ne change pas ce réglage lui-même.
export function usePushOptIn() {
    const supported = isPushSupported();
    const { data: vapidPublicKey = '' } = useVapidPublicKey({ enabled: supported });
    const subscribeMutation = usePushSubscribe();
    const unsubscribeMutation = usePushUnsubscribe();
    const [subscribed, setSubscribed] = useState(false);

    useEffect(() => {
        if (!supported) return;
        let cancelled = false;
        void getExistingPushSubscription().then((subscription) => {
            if (!cancelled) setSubscribed(subscription !== null);
        });
        return () => {
            cancelled = true;
        };
    }, [supported]);

    const permissionDenied = supported && typeof Notification !== 'undefined' && Notification.permission === 'denied';

    const status: PushOptInStatus = !supported
        ? 'unsupported'
        : !vapidPublicKey
          ? 'unavailable'
          : permissionDenied
            ? 'denied'
            : subscribed
              ? 'on'
              : 'off';

    const enable = useCallback(async () => {
        if (!vapidPublicKey) return;
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
        const subscription = await subscribeToPush(vapidPublicKey);
        await subscribeMutation.mutateAsync(subscription.toJSON() as PushSubscriptionPayload);
        setSubscribed(true);
    }, [vapidPublicKey, subscribeMutation]);

    const disable = useCallback(async () => {
        const subscription = await getExistingPushSubscription();
        if (subscription) {
            await unsubscribeMutation.mutateAsync(subscription.endpoint);
            await subscription.unsubscribe();
        }
        setSubscribed(false);
    }, [unsubscribeMutation]);

    return {
        status,
        pending: subscribeMutation.isPending || unsubscribeMutation.isPending,
        toggle: (next: boolean) => void (next ? enable() : disable()),
    };
}
