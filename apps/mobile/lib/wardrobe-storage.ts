'use client';

// Inventaire local scopé par user (v2). Migration v1 → v2 dans `migrateLegacyKeys()`.

import { useSyncExternalStore } from 'react';
import type { WardrobeItemDto, WardrobeSyncUpsert } from '@lumiris/api-client';
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

/** DPP Lumiris servi par le backend (page publique /p). Snapshot d'affichage pour la liste. */
export interface PublicDppItem {
    kind: 'public-dpp';
    publicCode: string;
    productName: string;
    grade?: string;
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

export type WardrobeItem = LumirisPassportItem | ExternalDppItem | PublicDppItem | ManualWardrobeItem;

export const WARDROBE_CHANGED_EVENT = 'lumiris:wardrobe-changed';
const EVENT = WARDROBE_CHANGED_EVENT;
const USER_CHANGED = 'lumiris:user-changed';

const subscribers = new Set<() => void>();

function scopeKey(userId: string | null): string {
    return userScopedKey(userId, USER_KEYS.wardrobe);
}

function syncKey(userId: string | null): string {
    return userScopedKey(userId, USER_KEYS.wardrobeSync);
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

function isPublicDppItem(value: unknown): value is PublicDppItem {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return (
        v.kind === 'public-dpp' &&
        typeof v.publicCode === 'string' &&
        typeof v.productName === 'string' &&
        (v.grade === undefined || typeof v.grade === 'string') &&
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
    return isLumirisPassportItem(value) || isExternalDppItem(value) || isPublicDppItem(value) || isManualItem(value);
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

function readScope(userId: string | null): WardrobeItem[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(scopeKey(userId));
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

function read(): WardrobeItem[] {
    return readScope(readUser()?.id ?? null);
}

interface PendingWardrobeChanges {
    upserts: WardrobeItem[];
    deletedKeys: string[];
}

const EMPTY_PENDING: PendingWardrobeChanges = { upserts: [], deletedKeys: [] };

// Lecture des elements de la garde robe à ajouter / delete de la DB wardrobe items
function readPending(userId: string | null): PendingWardrobeChanges {
    if (typeof window === 'undefined') return EMPTY_PENDING;
    try {
        const raw = window.localStorage.getItem(syncKey(userId));

        if (!raw) {
            const legacyItems = userId ? readScope(userId) : [];
            return legacyItems.length > 0 ? { upserts: legacyItems, deletedKeys: [] } : EMPTY_PENDING;
        }

        const parsed = JSON.parse(raw) as Partial<PendingWardrobeChanges>;
        const upserts = Array.isArray(parsed.upserts) ? parsed.upserts.filter(isWardrobeItem).map(withDocuments) : [];
        const deletedKeys = Array.isArray(parsed.deletedKeys)
            ? parsed.deletedKeys.filter((key): key is string => typeof key === 'string')
            : [];

        return { upserts, deletedKeys };
    } catch {
        return EMPTY_PENDING;
    }
}

function writePending(userId: string | null, pending: PendingWardrobeChanges): void {
    if (typeof window === 'undefined') return;
    if (pending.upserts.length === 0 && pending.deletedKeys.length === 0) {
        if (userId) window.localStorage.setItem(syncKey(userId), JSON.stringify(EMPTY_PENDING));
        else window.localStorage.removeItem(syncKey(userId));
        return;
    }
    window.localStorage.setItem(syncKey(userId), JSON.stringify(pending));
}

function recordPendingDiff(
    userId: string | null,
    before: readonly WardrobeItem[],
    after: readonly WardrobeItem[],
): void {
    const pending = readPending(userId);
    const upserts = new Map(pending.upserts.map((item) => [itemKey(item), item]));
    const deletedKeys = new Set(pending.deletedKeys);
    const beforeByKey = new Map(before.map((item) => [itemKey(item), item]));
    const afterByKey = new Map(after.map((item) => [itemKey(item), item]));

    for (const [key, item] of afterByKey) {
        const previous = beforeByKey.get(key);
        if (!previous || JSON.stringify(previous) !== JSON.stringify(item)) {
            upserts.set(key, item);
            deletedKeys.delete(key);
        }
    }
    for (const key of beforeByKey.keys()) {
        if (!afterByKey.has(key)) {
            upserts.delete(key);
            deletedKeys.add(key);
        }
    }
    writePending(userId, { upserts: [...upserts.values()], deletedKeys: [...deletedKeys] });
}

function writeScope(userId: string | null, items: readonly WardrobeItem[], trackChanges: boolean): void {
    if (typeof window === 'undefined') return;
    if (trackChanges) recordPendingDiff(userId, readScope(userId), items);
    window.localStorage.setItem(scopeKey(userId), JSON.stringify(items));
}

function write(items: readonly WardrobeItem[]): void {
    if (typeof window === 'undefined') return;
    const userId = readUser()?.id ?? null;
    writeScope(userId, items, true);
    notify();
}

export function itemKey(item: WardrobeItem): string {
    switch (item.kind) {
        case 'lumiris-passport':
            return `lumiris:${item.passportId}`;
        case 'external-dpp':
            return `gtin:${item.gtin}`;
        case 'public-dpp':
            return `public:${item.publicCode}`;
        case 'manual':
            return `manual:${item.id}`;
    }
}

export function readWardrobeForScope(userId: string | null): readonly WardrobeItem[] {
    return readScope(userId);
}

export function readPendingWardrobeChanges(userId: string): PendingWardrobeChanges {
    return readPending(userId);
}

function hasPendingWardrobeChanges(userId: string): boolean {
    const pending = readPending(userId);
    return pending.upserts.length > 0 || pending.deletedKeys.length > 0;
}

export function toWardrobeSyncUpsert(item: WardrobeItem): WardrobeSyncUpsert {
    const payload: Record<string, unknown> = (() => {
        switch (item.kind) {
            case 'lumiris-passport':
                return { passportId: item.passportId, careLog: item.careLog };
            case 'external-dpp':
                return { gtin: item.gtin };
            case 'public-dpp':
                return {
                    publicCode: item.publicCode,
                    productName: item.productName,
                    ...(item.grade ? { grade: item.grade } : {}),
                };
            case 'manual':
                return {
                    id: item.id,
                    sector: item.sector,
                    productName: item.productName,
                    ...(item.brand ? { brand: item.brand } : {}),
                    ...(item.acquiredAt ? { acquiredAt: item.acquiredAt } : {}),
                    ...(item.notes ? { notes: item.notes } : {}),
                };
        }
    })();
    return { clientKey: itemKey(item), kind: item.kind, addedAt: item.addedAt, payload };
}

function fromApiItem(dto: WardrobeItemDto, existing?: WardrobeItem): WardrobeItem | null {
    if (dto.origin !== 'user' || !dto.kind || !dto.payload) return null;
    const payload = dto.payload;
    const addedAt = dto.acquiredAt ?? new Date().toISOString();
    const documents = existing?.documents ?? [];
    const candidate: unknown = (() => {
        switch (dto.kind) {
            case 'lumiris-passport':
                return {
                    kind: dto.kind,
                    passportId: payload['passportId'],
                    addedAt,
                    careLog: Array.isArray(payload['careLog']) ? payload['careLog'] : [],
                    documents,
                };
            case 'external-dpp':
                return { kind: dto.kind, gtin: payload['gtin'], addedAt, documents };
            case 'public-dpp':
                return {
                    kind: dto.kind,
                    publicCode: payload['publicCode'],
                    productName: payload['productName'],
                    ...(typeof payload['grade'] === 'string' ? { grade: payload['grade'] } : {}),
                    addedAt,
                    documents,
                };
            case 'manual':
                return {
                    kind: dto.kind,
                    id: payload['id'],
                    sector: payload['sector'],
                    productName: payload['productName'],
                    ...(typeof payload['brand'] === 'string' ? { brand: payload['brand'] } : {}),
                    ...(typeof payload['acquiredAt'] === 'string' ? { acquiredAt: payload['acquiredAt'] } : {}),
                    ...(typeof payload['notes'] === 'string' ? { notes: payload['notes'] } : {}),
                    addedAt,
                    documents,
                };
        }
    })();
    return isWardrobeItem(candidate) ? withDocuments(candidate) : null;
}

function replaceUserItemsFromApi(userId: string, response: readonly WardrobeItemDto[]): void {
    const existing = new Map(readScope(userId).map((item) => [itemKey(item), item]));
    const items = response
        .map((dto) => fromApiItem(dto, dto.clientKey ? existing.get(dto.clientKey) : undefined))
        .filter((item): item is WardrobeItem => item !== null);
    writeScope(userId, items, false);
    writePending(userId, EMPTY_PENDING);
    notify();
}

export function applyWardrobeSyncResult(userId: string, response: readonly WardrobeItemDto[]): void {
    replaceUserItemsFromApi(userId, response);
    if (typeof window !== 'undefined') {
        window.localStorage.removeItem(scopeKey(null));
        window.localStorage.removeItem(syncKey(null));
    }
}

export function hydrateWardrobeFromApi(userId: string, response: readonly WardrobeItemDto[]): void {
    if (hasPendingWardrobeChanges(userId)) return;
    replaceUserItemsFromApi(userId, response);
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

export function addPublicDpp(input: { publicCode: string; productName: string; grade?: string }): void {
    const current = read();
    if (current.some((it) => it.kind === 'public-dpp' && it.publicCode === input.publicCode)) return;
    write([
        ...current,
        {
            kind: 'public-dpp',
            publicCode: input.publicCode,
            productName: input.productName,
            ...(input.grade ? { grade: input.grade } : {}),
            addedAt: new Date().toISOString(),
            documents: [],
        },
    ]);
}

export function removePublicDpp(publicCode: string): void {
    removeFromWardrobe(`public:${publicCode}`);
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

export function clearWardrobe(): void {
    write([]);
}

// Snapshot stable — `useSyncExternalStore` ne re-render que si la référence change.
const EMPTY: readonly WardrobeItem[] = [];
let snapshotCache: readonly WardrobeItem[] = EMPTY;
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

export function useWardrobe(): readonly WardrobeItem[] {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
