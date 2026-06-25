'use client';

// Panier marketplace scopé par user, même pattern que wardrobe-storage.
// Une ligne = un passeport en vente + une quantité.

import { useSyncExternalStore } from 'react';
import { readUser } from '../auth/storage';
import { USER_KEYS, userScopedKey } from '../storage-keys';
import { getListing } from './listings';

export interface CartLine {
    passportId: string;
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

function isCartLine(value: unknown): value is CartLine {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return typeof v.passportId === 'string' && typeof v.quantity === 'number' && typeof v.addedAt === 'string';
}

function read(): CartLine[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(currentKey());
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(isCartLine).filter((line) => line.quantity > 0);
    } catch {
        return [];
    }
}

function write(lines: readonly CartLine[]): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(currentKey(), JSON.stringify(lines));
    notify();
}

/** Borne la quantité au stock disponible de l'annonce. */
function clampToStock(passportId: string, quantity: number): number {
    const stock = getListing(passportId)?.stock ?? 0;
    if (stock <= 0) return 0;
    return Math.min(Math.max(1, Math.round(quantity)), stock);
}

export function addToCart(passportId: string, quantity = 1): void {
    const current = read();
    const existing = current.find((line) => line.passportId === passportId);
    if (existing) {
        const next = clampToStock(passportId, existing.quantity + quantity);
        write(current.map((line) => (line.passportId === passportId ? { ...line, quantity: next } : line)));
        return;
    }
    const qty = clampToStock(passportId, quantity);
    if (qty <= 0) return;
    write([...current, { passportId, quantity: qty, addedAt: new Date().toISOString() }]);
}

export function setCartQuantity(passportId: string, quantity: number): void {
    const current = read();
    if (quantity <= 0) {
        write(current.filter((line) => line.passportId !== passportId));
        return;
    }
    const qty = clampToStock(passportId, quantity);
    write(current.map((line) => (line.passportId === passportId ? { ...line, quantity: qty } : line)));
}

export function removeFromCart(passportId: string): void {
    write(read().filter((line) => line.passportId !== passportId));
}

export function clearCart(): void {
    write([]);
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
