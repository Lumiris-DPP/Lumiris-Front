'use client';

import { useCallback, useEffect, useState } from 'react';
import { getGeolocPermissionState } from './permission-storage';

export interface UserCoords {
    lat: number;
    lng: number;
}

type GeolocStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported';

export function useUserCoords() {
    const [coords, setCoords] = useState<UserCoords | null>(null);
    const [status, setStatus] = useState<GeolocStatus>('idle');

    const request = useCallback(() => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            setStatus('unsupported');
            return;
        }
        setStatus('requesting');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setStatus('granted');
            },
            () => setStatus('denied'),
            { timeout: 5000, maximumAge: 60_000 },
        );
    }, []);

    useEffect(() => {
        let cancelled = false;
        getGeolocPermissionState().then((state) => {
            if (cancelled) return;
            if (state === 'granted') request();
        });
        return () => {
            cancelled = true;
        };
    }, [request]);

    return { coords, status, request };
}
