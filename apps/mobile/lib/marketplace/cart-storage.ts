'use client';

// Panier marketplace scopé par user (localStorage), même pattern que wardrobe-storage.
// Une ligne = un produit réel (id) + une quantité. Le stock est borné par l'UI
// (qui dispose du produit) ; le backend revalide au moment du PaymentIntent.

import { useSyncExternalStore } from 'react';
import { readUser } from '../auth/storage';
import { USER_KEYS, userScopedKey } from '../storage-keys';

export interface CartLine {
    productId: string;
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
    return typeof v.productId === 'string' && typeof v.quantity === 'number' && typeof v.addedAt === 'string';
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

export function addToCart(productId: string, quantity = 1): void {
    const current = read();
    const existing = current.find((line) => line.productId === productId);
    if (existing) {
        const next = Math.max(1, existing.quantity + quantity);
        write(current.map((line) => (line.productId === productId ? { ...line, quantity: next } : line)));
        return;
    }
    write([...current, { productId, quantity: Math.max(1, quantity), addedAt: new Date().toISOString() }]);
}

export function setCartQuantity(productId: string, quantity: number): void {
    const current = read();
    if (quantity <= 0) {
        write(current.filter((line) => line.productId !== productId));
        return;
    }
    write(current.map((line) => (line.productId === productId ? { ...line, quantity } : line)));
}

export function removeFromCart(productId: string): void {
    write(read().filter((line) => line.productId !== productId));
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
