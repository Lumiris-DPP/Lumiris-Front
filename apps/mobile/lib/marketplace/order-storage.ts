'use client';

// Historique de commandes marketplace (mocké, scopé par user).
// La validation d'une commande déclenche l'ajout des pièces à la Garde-Robe
// avec des documents Facture + Garantie rattachés (voir checkout.ts).

import { useSyncExternalStore } from 'react';
import { readUser } from '../auth/storage';
import { USER_KEYS, userScopedKey } from '../storage-keys';

export interface OrderLine {
    passportId: string;
    reference: string;
    artisanName: string;
    unitPrice: number;
    quantity: number;
}

export interface ShippingAddress {
    fullName: string;
    line1: string;
    postalCode: string;
    city: string;
}

export interface Order {
    id: string;
    number: string;
    createdAt: string;
    lines: readonly OrderLine[];
    subtotal: number;
    shipping: number;
    total: number;
    address: ShippingAddress;
    cardLast4: string;
}

const EVENT = 'lumiris:orders-changed';
const USER_CHANGED = 'lumiris:user-changed';

const subscribers = new Set<() => void>();

function currentKey(): string {
    return userScopedKey(readUser()?.id ?? null, USER_KEYS.orders);
}

function notify(): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(EVENT));
    subscribers.forEach((cb) => cb());
}

function isOrder(value: unknown): value is Order {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v.id === 'string' &&
        typeof v.number === 'string' &&
        typeof v.createdAt === 'string' &&
        Array.isArray(v.lines) &&
        typeof v.total === 'number'
    );
}

function read(): Order[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(currentKey());
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(isOrder);
    } catch {
        return [];
    }
}

function write(orders: readonly Order[]): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(currentKey(), JSON.stringify(orders));
    notify();
}

export function generateOrderNumber(date: Date): string {
    const y = date.getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `LMR-${y}-${rand}`;
}

export function appendOrder(order: Order): void {
    write([order, ...read()]);
}

export function getOrderById(orderId: string): Order | null {
    return read().find((o) => o.id === orderId) ?? null;
}

const EMPTY: readonly Order[] = [];
let snapshotCache: readonly Order[] = EMPTY;
let snapshotSerialized = '';

function getSnapshot(): readonly Order[] {
    const current = read();
    const serialized = JSON.stringify(current);
    if (serialized !== snapshotSerialized) {
        snapshotCache = current;
        snapshotSerialized = serialized;
    }
    return snapshotCache;
}

function getServerSnapshot(): readonly Order[] {
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

export function useOrders(): readonly Order[] {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
