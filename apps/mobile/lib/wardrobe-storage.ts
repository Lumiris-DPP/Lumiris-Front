'use client';

// Inventaire local scopé par user (v2). Migration v1 → v2 dans `migrateLegacyKeys()`.

import { useSyncExternalStore } from 'react';
import { readUser } from './auth/storage';
import { USER_KEYS, userScopedKey } from './storage-keys';

interface CareLogEntry {
    date: string;
    action: string;
}

export type DocumentKind = 'invoice' | 'warranty' | 'insurance' | 'receipt' | 'repair-receipt' | 'manual' | 'other';

export const DOCUMENT_KINDS: readonly DocumentKind[] = [
    'invoice',
    'warranty',
    'insurance',
    'receipt',
    'repair-receipt',
    'manual',
    'other',
];

export interface WardrobeDocument {
    id: string;
    kind: DocumentKind;
    fileName: string;
    mimeType: string;
    byteLength: number;
    addedAt: string;
    /** Base64 du blob chiffré AES-GCM. */
    ciphertext: string;
    /** Base64 du nonce (12 octets) utilisé pour ce blob. */
    iv: string;
}

export type WardrobeSector = 'textile' | 'electronics' | 'appliance' | 'furniture' | 'toy' | 'battery';

export const WARDROBE_SECTORS: readonly WardrobeSector[] = [
    'textile',
    'electronics',
    'appliance',
    'furniture',
    'toy',
    'battery',
];

export const SECTOR_LABEL_FR: Record<WardrobeSector, string> = {
    textile: 'Textile',
    electronics: 'Électronique',
    appliance: 'Électroménager',
    furniture: 'Meuble',
    toy: 'Jouet',
    battery: 'Batterie',
};

export interface LumirisPassportItem {
    kind: 'lumiris-passport';
    passportId: string;
    addedAt: string;
    careLog: readonly CareLogEntry[];
    documents: readonly WardrobeDocument[];
}

export interface ExternalDppItem {
    kind: 'external-dpp';
    gtin: string;
    addedAt: string;
    documents: readonly WardrobeDocument[];
}

export interface ManualWardrobeItem {
    kind: 'manual';
    id: string;
    sector: WardrobeSector;
    productName: string;
    brand?: string;
    acquiredAt?: string;
    notes?: string;
    addedAt: string;
    documents: readonly WardrobeDocument[];
}

export type WardrobeItem = LumirisPassportItem | ExternalDppItem | ManualWardrobeItem;

const EVENT = 'lumiris:wardrobe-changed';
const USER_CHANGED = 'lumiris:user-changed';

const subscribers = new Set<() => void>();

function currentKey(): string {
    return userScopedKey(readUser()?.id ?? null, USER_KEYS.wardrobe);
}

function notify() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(EVENT));
    subscribers.forEach((cb) => cb());
}

function isCareLogEntry(value: unknown): value is CareLogEntry {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return typeof v.date === 'string' && typeof v.action === 'string';
}

function isWardrobeSector(value: unknown): value is WardrobeSector {
    return typeof value === 'string' && (WARDROBE_SECTORS as readonly string[]).includes(value);
}

function isDocumentKind(value: unknown): value is DocumentKind {
    return typeof value === 'string' && (DOCUMENT_KINDS as readonly string[]).includes(value);
}

function isWardrobeDocument(value: unknown): value is WardrobeDocument {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v.id === 'string' &&
        isDocumentKind(v.kind) &&
        typeof v.fileName === 'string' &&
        typeof v.mimeType === 'string' &&
        typeof v.byteLength === 'number' &&
        typeof v.addedAt === 'string' &&
        typeof v.ciphertext === 'string' &&
        typeof v.iv === 'string'
    );
}

// Entries pré-§6 sans `documents` : `read()` injecte un tableau vide.
function isOptionalDocumentArray(value: unknown): boolean {
    return value === undefined || (Array.isArray(value) && value.every(isWardrobeDocument));
}

function isLumirisPassportItem(value: unknown): value is LumirisPassportItem {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return (
        v.kind === 'lumiris-passport' &&
        typeof v.passportId === 'string' &&
        typeof v.addedAt === 'string' &&
        Array.isArray(v.careLog) &&
        v.careLog.every(isCareLogEntry) &&
        isOptionalDocumentArray(v.documents)
    );
}

function isExternalDppItem(value: unknown): value is ExternalDppItem {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return (
        v.kind === 'external-dpp' &&
        typeof v.gtin === 'string' &&
        typeof v.addedAt === 'string' &&
        isOptionalDocumentArray(v.documents)
    );
}

function isManualItem(value: unknown): value is ManualWardrobeItem {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return (
        v.kind === 'manual' &&
        typeof v.id === 'string' &&
        isWardrobeSector(v.sector) &&
        typeof v.productName === 'string' &&
        typeof v.addedAt === 'string' &&
        (v.brand === undefined || typeof v.brand === 'string') &&
        (v.acquiredAt === undefined || typeof v.acquiredAt === 'string') &&
        (v.notes === undefined || typeof v.notes === 'string') &&
        isOptionalDocumentArray(v.documents)
    );
}

function isWardrobeItem(value: unknown): value is WardrobeItem {
    return isLumirisPassportItem(value) || isExternalDppItem(value) || isManualItem(value);
}

function withDocuments(item: WardrobeItem): WardrobeItem {
    const docs = (item as { documents?: readonly WardrobeDocument[] }).documents;
    return Array.isArray(docs) ? item : { ...item, documents: [] };
}

interface LegacyEntry {
    passportId: string;
    addedAt: string;
    careLog: readonly CareLogEntry[];
}

function isLegacyEntry(value: unknown): value is LegacyEntry {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v.passportId === 'string' &&
        typeof v.addedAt === 'string' &&
        Array.isArray(v.careLog) &&
        v.careLog.every(isCareLogEntry) &&
        v.kind === undefined
    );
}

function legacyToItem(entry: LegacyEntry): LumirisPassportItem {
    return {
        kind: 'lumiris-passport',
        passportId: entry.passportId,
        addedAt: entry.addedAt,
        careLog: entry.careLog,
        documents: [],
    };
}

function read(): WardrobeItem[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(currentKey());
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        // v1 (sans `kind`) → mappé vers `lumiris-passport` ; absence de `documents` → tableau vide.
        return parsed
            .map((it) => (isLegacyEntry(it) ? legacyToItem(it) : it))
            .filter(isWardrobeItem)
            .map(withDocuments);
    } catch {
        return [];
    }
}

function write(items: readonly WardrobeItem[]): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(currentKey(), JSON.stringify(items));
    notify();
}

export function itemKey(item: WardrobeItem): string {
    switch (item.kind) {
        case 'lumiris-passport':
            return `lumiris:${item.passportId}`;
        case 'external-dpp':
            return `gtin:${item.gtin}`;
        case 'manual':
            return `manual:${item.id}`;
    }
}

function addLumirisPassport(passportId: string): void {
    const current = read();
    if (current.some((it) => it.kind === 'lumiris-passport' && it.passportId === passportId)) return;
    const next: LumirisPassportItem = {
        kind: 'lumiris-passport',
        passportId,
        addedAt: new Date().toISOString(),
        careLog: [],
        documents: [],
    };
    write([...current, next]);
}

export function addToWardrobe(passportId: string): void {
    addLumirisPassport(passportId);
}

export function addExternalDpp(gtin: string): void {
    const current = read();
    if (current.some((it) => it.kind === 'external-dpp' && it.gtin === gtin)) return;
    write([...current, { kind: 'external-dpp', gtin, addedAt: new Date().toISOString(), documents: [] }]);
}

interface ManualItemInput {
    sector: WardrobeSector;
    productName: string;
    brand?: string;
    acquiredAt?: string;
    notes?: string;
}

export function addManualItem(input: ManualItemInput): ManualWardrobeItem {
    const current = read();
    const next: ManualWardrobeItem = {
        kind: 'manual',
        id: crypto.randomUUID(),
        sector: input.sector,
        productName: input.productName,
        addedAt: new Date().toISOString(),
        documents: [],
        ...(input.brand && input.brand.trim() ? { brand: input.brand.trim() } : {}),
        ...(input.acquiredAt ? { acquiredAt: input.acquiredAt } : {}),
        ...(input.notes && input.notes.trim() ? { notes: input.notes.trim() } : {}),
    };
    write([...current, next]);
    return next;
}

/** Crée l'item passeport à la volée s'il n'existe pas — l'user n'a pas besoin de l'ajouter d'abord. */
export function attachDocumentToPassport(passportId: string, document: WardrobeDocument): void {
    const current = read();
    const exists = current.some((it) => it.kind === 'lumiris-passport' && it.passportId === passportId);
    if (!exists) {
        const next: LumirisPassportItem = {
            kind: 'lumiris-passport',
            passportId,
            addedAt: new Date().toISOString(),
            careLog: [],
            documents: [document],
        };
        write([...current, next]);
        return;
    }
    write(
        current.map((it) =>
            it.kind === 'lumiris-passport' && it.passportId === passportId
                ? { ...it, documents: [...it.documents, document] }
                : it,
        ),
    );
}

export function detachDocument(itemKeyValue: string, documentId: string): void {
    write(
        read().map((it) =>
            itemKey(it) === itemKeyValue
                ? ({ ...it, documents: it.documents.filter((d) => d.id !== documentId) } as WardrobeItem)
                : it,
        ),
    );
}

export function removeFromWardrobe(key: string): void {
    write(read().filter((item) => itemKey(item) !== key));
}

export function removeLumirisPassport(passportId: string): void {
    removeFromWardrobe(`lumiris:${passportId}`);
}

// Snapshot stable — `useSyncExternalStore` ne re-render que si la référence change.
let snapshotCache: readonly WardrobeItem[] = [];
let snapshotSerialized = '';

function getSnapshot(): readonly WardrobeItem[] {
    const current = read();
    const serialized = JSON.stringify(current);
    if (serialized !== snapshotSerialized) {
        snapshotCache = current;
        snapshotSerialized = serialized;
    }
    return snapshotCache;
}

function getServerSnapshot(): readonly WardrobeItem[] {
    return [];
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

export function useWardrobe(): readonly WardrobeItem[] {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
