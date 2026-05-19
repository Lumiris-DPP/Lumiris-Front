import { DEVICE_KEYS } from '@/lib/storage-keys';

const KEY = DEVICE_KEYS.geolocPromptSeen;

export function hasSeenGeolocPrompt(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        return window.localStorage.getItem(KEY) === '1';
    } catch {
        return false;
    }
}

export function markGeolocPromptSeen(): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(KEY, '1');
    } catch {
        // Stockage indisponible (mode privé Safari, quota dépassé) - on tolère silencieusement.
    }
}

type GeolocPermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';

export async function getGeolocPermissionState(): Promise<GeolocPermissionState> {
    if (typeof navigator === 'undefined' || !navigator.permissions) return 'unknown';
    try {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        return status.state as GeolocPermissionState;
    } catch {
        return 'unknown';
    }
}
