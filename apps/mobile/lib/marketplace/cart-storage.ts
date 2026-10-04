'use client';

import { useSyncExternalStore } from 'react';
import { readUser } from '../auth/storage';
import { USER_KEYS, userScopedKey } from '../storage-keys';
import { cartLineKey, resolveCartLines, subtractPurchase, type CartLine, type PurchasedLine } from './cart-model';
import type { MarketplaceItem } from './product';

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
    if (typeof v.productId !== 'string' || typeof v.quantity !== 'number' || typeof v.addedAt !== 'string') {
        return false;
    }
    return v.variantId === undefined || v.variantId === null || typeof v.variantId === 'string';
}

function sameLine(line: CartLine, productId: string, variantId: string | null): boolean {
    return line.productId === productId && line.variantId === variantId;
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

interface PendingPurchase {
    paymentIntentId: string;
    lines: PurchasedLine[];
}

const MAX_PENDING_PURCHASES = 20;

function purchasesKey(): string {
    return userScopedKey(readUser()?.id ?? null, USER_KEYS.pendingPurchases);
}

function isPendingPurchase(value: unknown): value is PendingPurchase {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v.paymentIntentId === 'string' &&
        Array.isArray(v.lines) &&
        v.lines.every(
            (line: unknown) =>
                !!line &&
                typeof line === 'object' &&
                typeof (line as PurchasedLine).productId === 'string' &&
                typeof (line as PurchasedLine).quantity === 'number',
        )
    );
}

function readPurchases(): PendingPurchase[] {
    if (typeof window === 'undefined') return [];
    try {
        const parsed: unknown = JSON.parse(window.localStorage.getItem(purchasesKey()) ?? '[]');
        return Array.isArray(parsed) ? parsed.filter(isPendingPurchase) : [];
    } catch {
        return [];
    }
}

export function resolveStoredCartLines(products: readonly MarketplaceItem[]): void {
    const current = read();
    const next = resolveCartLines(current, products);
    if (JSON.stringify(current) !== JSON.stringify(next)) write(next);
    const purchases = readPurchases();
    const resolved = purchases.map((purchase) => ({ ...purchase, lines: resolveCartLines(purchase.lines, products) }));
    if (JSON.stringify(purchases) !== JSON.stringify(resolved)) {
        window.localStorage.setItem(purchasesKey(), JSON.stringify(resolved));
    }
}

export function rememberPurchase(paymentIntentId: string, lines: readonly PurchasedLine[], buyerId: string): void {
    if (typeof window === 'undefined' || readUser()?.id !== buyerId) return;
    const others = readPurchases().filter((purchase) => purchase.paymentIntentId !== paymentIntentId);
    const next = [...others, { paymentIntentId, lines: [...lines] }].slice(-MAX_PENDING_PURCHASES);
    window.localStorage.setItem(purchasesKey(), JSON.stringify(next));
}

export function pendingPurchaseIds(): string[] {
    return readPurchases().map((purchase) => purchase.paymentIntentId);
}

export function settlePurchase(paymentIntentId: string): void {
    const purchase = readPurchases().find((p) => p.paymentIntentId === paymentIntentId);
    if (!purchase) return;
    forgetPurchase(paymentIntentId);
    write(subtractPurchase(read(), purchase.lines));
}

export function forgetPurchase(paymentIntentId: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
        purchasesKey(),
        JSON.stringify(readPurchases().filter((p) => p.paymentIntentId !== paymentIntentId)),
    );
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

    const merged = new Map<string, CartLine>();
    for (const line of readKey(userKey)) merged.set(cartLineKey(line.productId, line.variantId), line);
    for (const line of anonLines) {
        const key = cartLineKey(line.productId, line.variantId);
        const existing = merged.get(key);
        merged.set(key, existing ? { ...existing, quantity: Math.max(existing.quantity, line.quantity) } : line);
    }

    window.localStorage.setItem(userKey, JSON.stringify([...merged.values()]));
    window.localStorage.removeItem(anonKey);
    notify();
}

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
