'use client';

// AES-GCM 256 dérivé PBKDF2 (user.id ou device secret). TODO: schéma wrapped-key côté backend.

import { DEVICE_KEYS } from '../storage-keys';

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_SALT = new TextEncoder().encode('lumiris.documents.v1');
const IV_BYTES = 12;

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

export const ACCEPTED_DOCUMENT_MIMES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'] as const;

type AcceptedDocumentMime = (typeof ACCEPTED_DOCUMENT_MIMES)[number];

export function isAcceptedDocumentMime(mime: string): mime is AcceptedDocumentMime {
    return (ACCEPTED_DOCUMENT_MIMES as readonly string[]).includes(mime);
}

interface EncryptedBlob {
    ciphertext: string;
    iv: string;
}

function getSubtle(): SubtleCrypto {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
        throw new Error('SubtleCrypto indisponible dans cet environnement.');
    }
    return crypto.subtle;
}

function bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) {
        binary += String.fromCharCode(bytes[i] ?? 0);
    }
    return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
    const binary = atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i += 1) {
        view[i] = binary.charCodeAt(i);
    }
    return view;
}

function ensureDeviceSecret(): string {
    if (typeof window === 'undefined') {
        throw new Error('Pas de localStorage disponible.');
    }
    const existing = window.localStorage.getItem(DEVICE_KEYS.deviceKey);
    if (existing) return existing;
    const random = new Uint8Array(32);
    crypto.getRandomValues(random);
    const secret = bytesToBase64(random);
    window.localStorage.setItem(DEVICE_KEYS.deviceKey, secret);
    return secret;
}

function resolveSecret(userId: string | null): string {
    if (userId && userId.length > 0) return userId;
    return ensureDeviceSecret();
}

async function deriveAesKey(secret: string): Promise<CryptoKey> {
    const subtle = getSubtle();
    const baseKey = await subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'PBKDF2' }, false, [
        'deriveKey',
    ]);
    return subtle.deriveKey(
        { name: 'PBKDF2', salt: PBKDF2_SALT, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
    );
}

export async function encryptFile(file: File, userId: string | null): Promise<EncryptedBlob> {
    const subtle = getSubtle();
    const key = await deriveAesKey(resolveSecret(userId));
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const buffer = await file.arrayBuffer();
    const encrypted = await subtle.encrypt({ name: 'AES-GCM', iv }, key, buffer);
    return {
        ciphertext: bytesToBase64(new Uint8Array(encrypted)),
        iv: bytesToBase64(iv),
    };
}

export async function decryptToBlob(
    blob: { ciphertext: string; iv: string; mimeType: string },
    userId: string | null,
): Promise<Blob> {
    const subtle = getSubtle();
    const key = await deriveAesKey(resolveSecret(userId));
    const iv = base64ToBytes(blob.iv);
    const ciphertext = base64ToBytes(blob.ciphertext);
    const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new Blob([decrypted], { type: blob.mimeType });
}
