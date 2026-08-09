'use client';

// Dernière adresse de livraison utilisée, scopée par user. Elle n'a rien de confidentiel au-delà
// de l'appareil déjà déverrouillé, et la retenir évite de la ressaisir à chaque commande — c'est
// le principal frottement d'un achat mobile.

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

function currentKey(): string {
    return userScopedKey(readUser()?.id ?? null, USER_KEYS.shippingAddress);
}

function isAddress(value: unknown): value is ShippingAddress {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return typeof v.fullName === 'string' && typeof v.line1 === 'string' && typeof v.city === 'string';
}

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

export function writeShippingAddress(address: ShippingAddress): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(currentKey(), JSON.stringify(address));
}

// Champs strictement nécessaires à une expédition : un colis part avec un nom, une rue, un code
// postal et une ville. Le complément et le téléphone restent facultatifs.
export function isShippingAddressComplete(address: ShippingAddress): boolean {
    return (
        address.fullName.trim().length > 1 &&
        address.line1.trim().length > 2 &&
        address.postalCode.trim().length >= 4 &&
        address.city.trim().length > 1
    );
}

// Normalise avant envoi : les espaces de saisie n'ont rien à faire sur une étiquette de colis.
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
