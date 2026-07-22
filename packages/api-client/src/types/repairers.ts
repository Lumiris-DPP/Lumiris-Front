import type { KybDetailsResponse } from './kyb';

export type RepairerStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface RepairerProfileResponse {
    id: string;
    userEmail?: string;
    status: RepairerStatus;
    siret?: string;
    companyName?: string;
    displayName?: string;
    specialties?: string[];
    zones?: string[];
    schedule?: string;
    address?: string;
    city?: string;
    region?: string;
    averageRating?: number;
    reviewCount: number;
    createdAt: string;
    kyb?: KybDetailsResponse;
}

export interface RepairerRegisterRequest {
    siret: string;
}

export interface RepairerProfileUpdateRequest {
    displayName?: string;
    specialties?: string[];
    zones?: string[];
    schedule?: string;
    address?: string;
    city?: string;
    region?: string;
}

export interface RepairerPublicProfileResponse {
    id: string;
    displayName?: string;
    companyName?: string;
    specialties?: string[];
    zones?: string[];
    schedule?: string;
    address?: string;
    city?: string;
    region?: string;
    averageRating?: number;
    reviewCount: number;
}

export interface RepairerSearchResult {
    id: string;
    displayName?: string;
    companyName?: string;
    specialties?: string[];
    zones?: string[];
    schedule?: string;
    address?: string;
    city?: string;
    region?: string;
    distanceKm: number;
    lat: number;
    lng: number;
}

export interface RepairerSearchQuery {
    lat: number;
    lng: number;
    specialty?: string;
    radiusKm?: number;
}

export interface RepairerReviewRequest {
    rating: number;
    comment?: string;
    reviewerName: string;
}

export interface RepairerReviewResponse {
    id: string;
    rating: number;
    comment?: string;
    reviewerName?: string;
    createdAt: string;
}

export type RepairRequestStatus = 'PENDING' | 'DRAFT' | 'ACCEPTED' | 'REFUSED' | 'IN_PROGRESS' | 'COMPLETED';

export interface RepairRequestCreateRequest {
    repairerId: string;
    dppPublicCode: string;
    message?: string;
}

export interface RepairQuoteRequest {
    amountCents: number;
    description: string;
}

export interface RepairAppointmentRequest {
    appointmentAt: string;
}

export interface RepairRequestResponse {
    id: string;
    repairerProfileId: string;
    repairerDisplayName?: string;
    consumerName?: string;
    dppFormId: string;
    dppPublicCode: string;
    dppProductName?: string;
    message?: string;
    status: RepairRequestStatus;
    quoteAmountCents?: number;
    quoteDescription?: string;
    quoteSubmittedAt?: string;
    appointmentAt?: string;
    createdAt: string;
}

export interface RepairMessageRequest {
    body: string;
}

export interface RepairMessageResponse {
    id: string;
    senderName?: string;
    fromRepairer: boolean;
    body: string;
    createdAt: string;
}
