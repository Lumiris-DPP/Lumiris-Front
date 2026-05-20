import { DEVICE_KEYS } from '../storage-keys';

const KEY = DEVICE_KEYS.onboardingCompleted;

export function hasCompletedOnboarding(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        return window.localStorage.getItem(KEY) === '1';
    } catch {
        return false;
    }
}

export function markOnboardingCompleted(): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(KEY, '1');
    } catch {
        // localStorage indisponible (Safari privé) — l'onboarding se rejouera au prochain lancement.
    }
}
