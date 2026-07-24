// Formats reconnus : URL passeport canonique, GS1 Digital Link, query `?gtin=`.

import { mockExternalDppByGtin, mockPassportById, mockPassportByGtin } from '@lumiris/mock-data';
import type { ExternalDpp, Passport } from '@lumiris/types';

type DecodedScan =
    | { kind: 'passport-id'; id: string }
    | { kind: 'public-code'; code: string; accessToken?: string }
    | { kind: 'gs1-gtin'; gtin: string; serial?: string }
    | { kind: 'unknown'; raw: string };

type ScanResult =
    | { kind: 'lumiris-passport'; passport: Passport }
    | { kind: 'lumiris-public-code'; code: string; accessToken?: string }
    | { kind: 'external-dpp'; dpp: ExternalDpp }
    | { kind: 'unknown'; raw: string };

/** `?k=` d'une URL de QR d'accès élargi. Absent des QR publics, qui n'en ont pas besoin. */
function accessTokenFrom(payload: string): string | undefined {
    const match = payload.match(/[?&]k=([\w-]+)/);
    return match?.[1];
}

export function decodeQrPayload(payload: string): DecodedScan {
    const trimmed = payload.trim();
    if (!trimmed) return { kind: 'unknown', raw: payload };

    const publicCodeUrlMatch = trimmed.match(/\/p\/([\w-]{8})\b/i);
    if (publicCodeUrlMatch?.[1]) {
        return {
            kind: 'public-code',
            code: publicCodeUrlMatch[1].toUpperCase(),
            accessToken: accessTokenFrom(trimmed),
        };
    }

    const passportUrlMatch = trimmed.match(/lumiris\.fr\/passeport\/([\w-]+)/i);
    if (passportUrlMatch?.[1]) {
        return { kind: 'passport-id', id: passportUrlMatch[1] };
    }

    const gs1Match = trimmed.match(/\/01\/(\d{8,14})(?:\/21\/([\w-]+))?/i);
    if (gs1Match?.[1]) {
        return { kind: 'gs1-gtin', gtin: gs1Match[1], serial: gs1Match[2] };
    }

    try {
        const url = new URL(trimmed);
        const gtin = url.searchParams.get('gtin');
        if (gtin && /^\d{8,14}$/.test(gtin)) {
            const serial = url.searchParams.get('serial') ?? undefined;
            return { kind: 'gs1-gtin', gtin, serial };
        }
    } catch {
        // not a valid URL — fall through to the 'unknown' branch
    }

    return { kind: 'unknown', raw: trimmed };
}

/** Ordre volontaire : GTIN LUMIRIS prime toujours sur la branche externe. */
export function resolvePassportFromScan(decoded: DecodedScan): ScanResult {
    if (decoded.kind === 'public-code') {
        return { kind: 'lumiris-public-code', code: decoded.code, accessToken: decoded.accessToken };
    }
    if (decoded.kind === 'passport-id') {
        const passport = mockPassportById(decoded.id);
        if (passport) return { kind: 'lumiris-passport', passport };
        return { kind: 'unknown', raw: decoded.id };
    }
    if (decoded.kind === 'gs1-gtin') {
        const passport = mockPassportByGtin(decoded.gtin);
        if (passport) return { kind: 'lumiris-passport', passport };
        const external = mockExternalDppByGtin(decoded.gtin);
        if (external) return { kind: 'external-dpp', dpp: external };
        return { kind: 'unknown', raw: decoded.gtin };
    }
    return { kind: 'unknown', raw: decoded.raw };
}
