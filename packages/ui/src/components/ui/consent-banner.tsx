'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Bandeau de consentement à la mesure d'audience, conforme aux lignes directrices CNIL :
 * - rien de non-essentiel n'est chargé tant que l'utilisateur n'a pas choisi (voir `useConsent`) ;
 * - « Refuser » est aussi accessible que « Accepter » (même niveau, un seul clic) ;
 * - le choix est mémorisé et révocable à tout moment (`ConsentSettingsLink`).
 *
 * Le choix vit dans `localStorage` (par navigateur, aucun envoi serveur). Il n'y a volontairement
 * qu'une seule catégorie : Lumiris ne pose ni cookie publicitaire ni traceur tiers.
 */

const STORAGE_KEY = 'lumiris-consent';
const EVENT = 'lumiris-consent-change';

export interface ConsentState {
    analytics: boolean;
    ts: string;
}

function read(): ConsentState | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as ConsentState) : null;
    } catch {
        return null;
    }
}

function decide(analytics: boolean): void {
    const state: ConsentState = { analytics, ts: new Date().toISOString() };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Stockage indisponible (navigation privée stricte) : le choix vaut pour la session.
    }
    window.dispatchEvent(new CustomEvent(EVENT, { detail: state }));
}

/** Rouvre le bandeau — à câbler sur un lien « Gérer les cookies ». */
export function openConsentSettings(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore
    }
    window.dispatchEvent(new CustomEvent(EVENT, { detail: null }));
}

/**
 * État du consentement. `decided` est faux tant que l'utilisateur n'a pas répondu — les
 * consommateurs (Web Vitals, analytics) ne doivent rien charger dans ce cas.
 */
export function useConsent(): { analytics: boolean; decided: boolean } {
    const [state, setState] = useState<ConsentState | null | undefined>(undefined);

    useEffect(() => {
        setState(read());
        const onChange = (e: Event) => setState((e as CustomEvent<ConsentState | null>).detail);
        window.addEventListener(EVENT, onChange);
        return () => window.removeEventListener(EVENT, onChange);
    }, []);

    return { analytics: state?.analytics ?? false, decided: state !== undefined && state !== null };
}

export interface ConsentBannerProps {
    /** Lien vers la politique de confidentialité de l'app hôte. */
    privacyHref?: string;
}

export function ConsentBanner({ privacyHref = '/confidentialite' }: ConsentBannerProps) {
    const [state, setState] = useState<ConsentState | null | undefined>(undefined);

    useEffect(() => {
        setState(read());
        const onChange = (e: Event) => setState((e as CustomEvent<ConsentState | null>).detail);
        window.addEventListener(EVENT, onChange);
        return () => window.removeEventListener(EVENT, onChange);
    }, []);

    // Pas encore monté, ou choix déjà fait : rien à afficher.
    if (state === undefined || state !== null) return null;

    return (
        <div
            role="dialog"
            aria-label="Consentement à la mesure d'audience"
            className="fixed inset-x-0 bottom-[var(--app-bottom-inset,0px)] z-modal border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur sm:p-6"
        >
            <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                    Nous mesurons l&apos;audience et la performance du service de façon anonyme pour l&apos;améliorer.
                    Aucun cookie publicitaire, aucun partage à des tiers.{' '}
                    <a href={privacyHref} className="text-foreground underline underline-offset-4">
                        En savoir plus
                    </a>
                    .
                </p>
                <div className="flex shrink-0 gap-2">
                    <button
                        type="button"
                        onClick={() => decide(false)}
                        className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                    >
                        Refuser
                    </button>
                    <button
                        type="button"
                        onClick={() => decide(true)}
                        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
                    >
                        Accepter
                    </button>
                </div>
            </div>
        </div>
    );
}

/** Lien « Gérer les cookies » — révoque ou modifie le choix à tout moment. */
export function ConsentSettingsLink({ className }: { className?: string }) {
    const reopen = useCallback(() => openConsentSettings(), []);
    return (
        <button type="button" onClick={reopen} className={className}>
            Gérer les cookies
        </button>
    );
}
