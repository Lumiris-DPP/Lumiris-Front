'use client';

// Panier marketplace scopé par user (localStorage), même pattern que wardrobe-storage.
// Une ligne = un produit réel (id) + une quantité. Le stock est borné par l'UI
// (qui dispose du produit) ; le backend revalide au moment du PaymentIntent.

import { useSyncExternalStore } from 'react';
import { readUser } from '../auth/storage';
import { USER_KEYS, userScopedKey } from '../storage-keys';
import { cartLineKey, subtractPurchase, type CartLine, type PurchasedLine } from './cart-model';

const EVENT = 'lumiris:cart-changed';
const USER_CHANGED = 'lumiris:user-changed';

const subscribers = new Set<() => void>();

/** Choisit la clé du panier du compte courant ou de l’invité. */
function currentKey(): string {
    return userScopedKey(readUser()?.id ?? null, USER_KEYS.cart);
}

/** Informe les lecteurs locaux du changement de stockage. */
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

/** Compare le produit et la déclinaison d’une ligne de panier. */
function sameLine(line: CartLine, productId: string, variantId: string | null): boolean {
    return line.productId === productId && line.variantId === variantId;
}

/** Relit les lignes locales du panier courant. */
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

/** Enregistre le panier courant et prévient ses lecteurs. */
function write(lines: readonly CartLine[]): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(currentKey(), JSON.stringify(lines));
    notify();
}

/** Ajoute une déclinaison au panier ou augmente sa quantité. */
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

/** Modifie la quantité de la déclinaison ou la retire si elle est nulle. */
export function setCartQuantity(productId: string, variantId: string | null, quantity: number): void {
    const current = read();
    if (quantity <= 0) {
        write(current.filter((line) => !sameLine(line, productId, variantId)));
        return;
    }
    write(current.map((line) => (sameLine(line, productId, variantId) ? { ...line, quantity } : line)));
}

/** Retire seulement la déclinaison demandée du panier. */
export function removeFromCart(productId: string, variantId: string | null): void {
    write(read().filter((line) => !sameLine(line, productId, variantId)));
}

// Lignes réservées par chaque PaymentIntent préparé. Seul ce mémo permet de retirer du panier ce
// qui a été payé, et rien d'autre : l'URL de confirmation, elle, ne prouve rien.
interface PendingPurchase {
    paymentIntentId: string;
    lines: PurchasedLine[];
}

// Borne le mémo : une tentative remplacée (panier modifié, nouveau paiement) n'est jamais confirmée.
const MAX_PENDING_PURCHASES = 20;

/** Choisit la clé des paiements préparés du compte courant. */
function purchasesKey(): string {
    return userScopedKey(readUser()?.id ?? null, USER_KEYS.pendingPurchases);
}

/** Vérifie la forme d’un paiement préparé relu du stockage. */
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

/** Relit les paiements préparés dont le sort reste à connaître. */
function readPurchases(): PendingPurchase[] {
    if (typeof window === 'undefined') return [];
    try {
        const parsed: unknown = JSON.parse(window.localStorage.getItem(purchasesKey()) ?? '[]');
        return Array.isArray(parsed) ? parsed.filter(isPendingPurchase) : [];
    } catch {
        return [];
    }
}

/** Mémorise les lignes que le PaymentIntent vient de réserver, pour les retirer une fois payées. */
export function rememberPurchase(paymentIntentId: string, lines: readonly PurchasedLine[], buyerId: string): void {
    // Une réponse tardive de paiement ne doit jamais écrire dans le panier d'un autre compte.
    if (typeof window === 'undefined' || readUser()?.id !== buyerId) return;
    const others = readPurchases().filter((purchase) => purchase.paymentIntentId !== paymentIntentId);
    const next = [...others, { paymentIntentId, lines: [...lines] }].slice(-MAX_PENDING_PURCHASES);
    window.localStorage.setItem(purchasesKey(), JSON.stringify(next));
}

/** Paiements préparés dont le sort n'est pas encore connu du panier. */
export function pendingPurchaseIds(): string[] {
    return readPurchases().map((purchase) => purchase.paymentIntentId);
}

/**
 * Retire du panier les lignes d'un paiement confirmé par le serveur, une seule fois : le mémo est
 * consommé, et une nouvelle visite de la confirmation ne retire plus rien.
 */
export function settlePurchase(paymentIntentId: string): void {
    const purchase = readPurchases().find((p) => p.paymentIntentId === paymentIntentId);
    if (!purchase) return;
    forgetPurchase(paymentIntentId);
    write(subtractPurchase(read(), purchase.lines));
}

/** Oublie un paiement annulé ou remboursé : ses lignes restent dans le panier. */
export function forgetPurchase(paymentIntentId: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
        purchasesKey(),
        JSON.stringify(readPurchases().filter((p) => p.paymentIntentId !== paymentIntentId)),
    );
}

/** Relit les lignes du panier à la clé fournie. */
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

// Snapshot stable pour useSyncExternalStore.
const EMPTY: readonly CartLine[] = [];
let snapshotCache: readonly CartLine[] = EMPTY;
let snapshotSerialized = '';

/** Conserve un instantané stable tant que le stockage ne change pas. */
function getSnapshot(): readonly CartLine[] {
    const current = read();
    const serialized = JSON.stringify(current);
    if (serialized !== snapshotSerialized) {
        snapshotCache = current;
        snapshotSerialized = serialized;
    }
    return snapshotCache;
}

/** Fournit l’état initial sans stockage navigateur. */
function getServerSnapshot(): readonly CartLine[] {
    return EMPTY;
}

/** Abonne les lecteurs aux changements du stockage local et du compte. */
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

/** Expose les lignes du panier courant aux composants. */
export function useCart(): readonly CartLine[] {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Compte les quantités des déclinaisons du panier courant. */
export function useCartCount(): number {
    const lines = useCart();
    return lines.reduce((sum, line) => sum + line.quantity, 0);
}
