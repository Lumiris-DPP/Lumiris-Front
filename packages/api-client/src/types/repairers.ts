import type { KybDetailsResponse } from './kyb';

export type RepairerStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'UNCLAIMED' | 'SUSPENDED';

export type RepairerSource = 'SELF' | 'SIRENE' | 'CMA' | 'OSM' | 'MANUAL';

export interface RepairerProfileResponse {
    id: string;
    userEmail?: string;
    status: RepairerStatus;
    source?: RepairerSource;
    importedAt?: string;
    claimedAt?: string;
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

// --- Réclamation d'une fiche annuaire ---

export interface RepairerClaimPreview {
    displayName?: string;
    companyName?: string;
    siret?: string;
    address?: string;
    city?: string;
    region?: string;
    specialties?: string[];
}

export interface RepairerClaimRequest {
    token: string;
}

// --- Import annuaire (admin) ---

export interface RepairerDirectoryImportRequest {
    source: RepairerSource;
    departments?: string[];
    nafCodes?: string[];
    maxPages?: number;
}

export interface RepairerDirectoryImportReport {
    source: RepairerSource;
    fetched: number;
    created: number;
    updated: number;
    skipped: number;
}

export interface RepairerInviteRequest {
    email: string;
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
    // Délai médian demande -> devis, en heures (null si aucun devis encore).
    medianResponseHours?: number;
    // Part de devis acceptés parmi les devis tranchés (0..1), null si aucune décision.
    acceptanceRate?: number;
    // Interventions terminées avec devis.
    completedJobs?: number;
}

// Zone où des consommateurs cherchent un retoucheur sans en trouver.
export interface CoverageGapResponse {
    lat: number;
    lng: number;
    missCount: number;
    lastSeen: string;
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
    averageRating?: number;
    reviewCount?: number;
    // Délai médian demande -> devis, en heures.
    medianResponseHours?: number;
    // false = fiche annuaire sans compte : CTA doux au lieu d'une prise de RDV.
    claimed?: boolean;
}

export type RepairerSearchSort = 'distance' | 'rating' | 'responsiveness';

export interface RepairerSearchQuery {
    lat: number;
    lng: number;
    specialty?: string;
    radiusKm?: number;
    sort?: RepairerSearchSort;
    page?: number;
    size?: number;
}

export interface AdminAuditEntry {
    id: string;
    actorEmail: string;
    action: string;
    targetType: string;
    targetId?: string;
    detail?: string;
    occurredAt: string;
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
    // true si l'avis est rattaché à une intervention terminée (toujours renvoyé par l'API ;
    // optionnel ici pour les jeux de données locaux).
    verified?: boolean;
    createdAt: string;
}

// Avis vérifié : posté par le client d'une demande de réparation terminée.
export interface RepairRequestReviewRequest {
    rating: number;
    comment?: string;
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

// Règlement du devis (le paiement vaut acceptation). appointmentAt optionnel.
export interface RepairPayRequest {
    appointmentAt?: string;
}

export interface RepairPaymentIntentResponse {
    clientSecret: string;
    publishableKey: string;
    amountCents: number;
    currency: string;
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
    paidAt?: string;
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
