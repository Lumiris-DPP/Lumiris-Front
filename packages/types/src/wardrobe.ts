import type { IrisGrade } from './score';

export interface WardrobeFallback {
    name: string;
    brand: string;
    photoUrl?: string;
    estimatedGrade?: IrisGrade;
}

export interface WardrobeItem {
    id: string;
    userId: string;
    scannedAt: string;
    passportId?: string;
    fallback?: WardrobeFallback;
    notes?: string;
}
