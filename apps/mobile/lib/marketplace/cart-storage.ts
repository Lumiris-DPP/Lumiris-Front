'use client';

// Panier marketplace scopé par user (localStorage), même pattern que wardrobe-storage.
// Une ligne = un produit réel (id) + une quantité. Le stock est borné par l'UI
// (qui dispose du produit) ; le backend revalide au moment du PaymentIntent.

import { useSyncExternalStore } from 'react';
import { readUser } from '../auth/storage';
import { USER_KEYS, userScopedKey } from '../storage-keys';

export interface CartLine {
    productId: string;
    /** Déclinaison achetée. `null` sur les lignes créées avant les déclinaisons. */
    variantId: string | null;
    quantity: number;
    addedAt: string;
}

const EVENT = 'lumiris:cart-changed';
const USER_CHANGED = 'lumiris:user-changed';

const subscribers = new Set<() => void>();

function currentKey(): string {
    return userScopedKey(readUser()?.id ?? null, USER_KEYS.cart);
}

function notify(): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(EVENT));
    subscribers.forEach((cb) => cb());
}

// Le champ `variantId` est additif : une ligne écrite par un bundle antérieur reste valide, et un
// bundle antérieur relit sans broncher les lignes écrites ici. C'est ce qui permet de garder la
// clé `cart.v1` — un bump ferait voir deux paniers différents sur le même téléphone.
function isCartLine(value: unknown): value is CartLine {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    if (typeof v.productId !== 'string' || typeof v.quantity !== 'number' || typeof v.addedAt !== 'string') {
        return false;
    }
    return v.variantId === undefined || v.variantId === null || typeof v.variantId === 'string';
}

function sameLine(line: CartLine, productId: string, variantId: string | null): boolean {
    return line.productId === productId && line.variantId === variantId;
}

function lineKey(productId: string, variantId: string | null): string {
    return `${productId}:${variantId ?? ''}`;
}

function read(): CartLine[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(currentKey());
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter(isCartLine)
            .map((line) => ({ ...line, variantId: line.variantId ?? null }))
            .filter((line) => line.quantity > 0);
    } catch {
        return [];
    }
}

function write(lines: readonly CartLine[]): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(currentKey(), JSON.stringify(lines));
    notify();
}

export function addToCart(productId: string, variantId: string | null, quantity = 1): void {
    const current = read();
    const existing = current.find((line) => sameLine(line, productId, variantId));
    if (existing) {
        const next = Math.max(1, existing.quantity + quantity);
        write(current.map((line) => (sameLine(line, productId, variantId) ? { ...line, quantity: next } : line)));
        return;
    }
    write([...current, { productId, variantId, quantity: Math.max(1, quantity), addedAt: new Date().toISOString() }]);
}

export function setCartQuantity(productId: string, variantId: string | null, quantity: number): void {
    const current = read();
    if (quantity <= 0) {
        write(current.filter((line) => !sameLine(line, productId, variantId)));
        return;
    }
    write(current.map((line) => (sameLine(line, productId, variantId) ? { ...line, quantity } : line)));
}

export function removeFromCart(productId: string, variantId: string | null): void {
    write(read().filter((line) => !sameLine(line, productId, variantId)));
}

export function clearCart(): void {
    write([]);
}

function readKey(key: string): CartLine[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter(isCartLine)
            .map((line) => ({ ...line, variantId: line.variantId ?? null }))
            .filter((line) => line.quantity > 0);
    } catch {
        return [];
    }
}

/**
 * Fusionne le panier invité (`lumiris.anon.cart.v1`) dans le panier de l'utilisateur qui vient
 * de se connecter, puis vide le panier invité. À appeler juste APRÈS `writeUser` dans `signIn`,
 * pour qu'un invité ayant rempli son panier le conserve après connexion. Idempotent : sans panier
 * invité, ne fait rien. Sur doublon de produit, on garde la quantité la plus élevée (le backend
 * reborne le stock au PaymentIntent).
 */
export function migrateAnonCartToUser(userId: string): void {
    if (typeof window === 'undefined') return;

    const anonKey = userScopedKey(null, USER_KEYS.cart);
    const userKey = userScopedKey(userId, USER_KEYS.cart);
    if (anonKey === userKey) return;

    const anonLines = readKey(anonKey);
    if (anonLines.length === 0) {
        window.localStorage.removeItem(anonKey);
        return;
    }

    // La clé de fusion porte la déclinaison : sans elle, un invité qui avait ajouté du M et du L
    // n'en garderait qu'un après connexion.
    const merged = new Map<string, CartLine>();
    for (const line of readKey(userKey)) merged.set(lineKey(line.productId, line.variantId), line);
    for (const line of anonLines) {
        const key = lineKey(line.productId, line.variantId);
        const existing = merged.get(key);
        merged.set(key, existing ? { ...existing, quantity: Math.max(existing.quantity, line.quantity) } : line);
    }

    window.localStorage.setItem(userKey, JSON.stringify([...merged.values()]));
    window.localStorage.removeItem(anonKey);
    notify();
}

// Snapshot stable pour useSyncExternalStore.
const EMPTY: readonly CartLine[] = [];
let snapshotCache: readonly CartLine[] = EMPTY;
let snapshotSerialized = '';

function getSnapshot(): readonly CartLine[] {
    const current = read();
    const serialized = JSON.stringify(current);
    if (serialized !== snapshotSerialized) {
        snapshotCache = current;
        snapshotSerialized = serialized;
    }
    return snapshotCache;
}

function getServerSnapshot(): readonly CartLine[] {
    return EMPTY;
}

function subscribe(cb: () => void): () => void {
    subscribers.add(cb);
    if (typeof window !== 'undefined') {
        window.addEventListener(EVENT, cb);
        window.addEventListener('storage', cb);
        window.addEventListener(USER_CHANGED, cb);
    }
    return () => {
        subscribers.delete(cb);
        if (typeof window !== 'undefined') {
            window.removeEventListener(EVENT, cb);
            window.removeEventListener('storage', cb);
            window.removeEventListener(USER_CHANGED, cb);
        }
    };
}

export function useCart(): readonly CartLine[] {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useCartCount(): number {
    const lines = useCart();
    return lines.reduce((sum, line) => sum + line.quantity, 0);
}
