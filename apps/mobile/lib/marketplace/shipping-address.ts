'use client';

import type { CartShippingAddress } from '@lumiris/api-client';
import { readUser } from '../auth/storage';
import { USER_KEYS, userScopedKey } from '../storage-keys';

export type ShippingAddress = CartShippingAddress;

export const EMPTY_ADDRESS: ShippingAddress = {
    fullName: '',
    line1: '',
    line2: '',
    postalCode: '',
    city: '',
    country: 'FR',
    phone: '',
};

// Identifie le stockage de l’adresse pour le compte courant.
function currentKey(): string {
    return userScopedKey(readUser()?.id ?? null, USER_KEYS.shippingAddress);
}

// Vérifie les champs essentiels d’une adresse enregistrée.
function isAddress(value: unknown): value is ShippingAddress {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return typeof v.fullName === 'string' && typeof v.line1 === 'string' && typeof v.city === 'string';
}

// Relit l’adresse valide du compte courant.
export function readShippingAddress(): ShippingAddress | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(currentKey());
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        return isAddress(parsed) ? { ...EMPTY_ADDRESS, ...parsed } : null;
    } catch {
        return null;
    }
}

// Enregistre l’adresse du compte courant.
export function writeShippingAddress(address: ShippingAddress): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(currentKey(), JSON.stringify(address));
}

// Vérifie les champs nécessaires à la livraison.
export function isShippingAddressComplete(address: ShippingAddress): boolean {
    return (
        address.fullName.trim().length > 1 &&
        address.line1.trim().length > 2 &&
        address.postalCode.trim().length >= 4 &&
        address.city.trim().length > 1
    );
}

// Nettoie les champs de l’adresse de livraison.
export function normalizeShippingAddress(address: ShippingAddress): ShippingAddress {
    return {
        fullName: address.fullName.trim(),
        line1: address.line1.trim(),
        line2: address.line2?.trim() || undefined,
        postalCode: address.postalCode.trim(),
        city: address.city.trim(),
        country: (address.country || 'FR').toUpperCase(),
        phone: address.phone?.trim() || undefined,
    };
}
