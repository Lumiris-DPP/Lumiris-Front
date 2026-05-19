import { DEVICE_KEYS } from '@/lib/storage-keys';

const KEY = DEVICE_KEYS.cameraPromptSeen;

export function hasSeenCameraPrompt(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        return window.localStorage.getItem(KEY) === '1';
    } catch {
        return false;
    }
}

export function markCameraPromptSeen(): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(KEY, '1');
    } catch {
        // Stockage indisponible (mode privé Safari, quota dépassé) - on tolère silencieusement.
    }
}

type CameraPermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';

// `navigator.permissions.query({ name: 'camera' })` n'est pas typé par TS DOM ;
// on contourne avec un type local au lieu d'un `any`.
interface PermissionsQueryWithCamera {
    query: (descriptor: { name: 'camera' }) => Promise<{ state: 'granted' | 'denied' | 'prompt' }>;
}

export async function getCameraPermissionState(): Promise<CameraPermissionState> {
    if (typeof navigator === 'undefined') return 'unknown';
    const permissions = (navigator as Navigator & { permissions?: PermissionsQueryWithCamera }).permissions;
    if (!permissions?.query) return 'unknown';
    try {
        const status = await permissions.query({ name: 'camera' });
        return status.state;
    } catch {
        // Firefox renvoie une TypeError pour `name: 'camera'` (non supporté).
        return 'unknown';
    }
}
