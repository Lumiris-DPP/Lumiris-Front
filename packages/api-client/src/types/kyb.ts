// 0 = Solo (entreprise individuelle), 1 = Company, 2 = Association — matches backend LegalCategory.
export type KybLegalCategory = 0 | 1 | 2;

export interface KybDetailsRequest {
    category: KybLegalCategory;
    businessEntity: string;
    vatNumber?: string;
    addressLine1: string;
    addressCity: string;
    addressPostalCode: string;
    addressCountry: string;

    repFirstName: string;
    repLastName: string;
    repBirthDate: string; // ISO date (yyyy-MM-dd)
    repNationality: string;
    repAddressLine1: string;
    repAddressCity: string;
    repAddressPostalCode: string;
    repAddressCountry: string;
    repIsUbo: boolean;
    repOwnershipPercentage?: number;

    termsAccepted: boolean;
}

export type KybStatus = 'PENDING' | 'ONGOING' | 'VALIDATED' | 'REJECTED' | 'INCOMPLETE';

export interface KybDetailsResponse {
    category?: KybLegalCategory;
    businessEntity?: string;
    vatNumber?: string;
    addressLine1?: string;
    addressCity?: string;
    addressPostalCode?: string;
    addressCountry?: string;
    termsAcceptedAt?: string;

    repFirstName?: string;
    repLastName?: string;
    repBirthDate?: string;
    repNationality?: string;
    repAddressLine1?: string;
    repAddressCity?: string;
    repAddressPostalCode?: string;
    repAddressCountry?: string;
    repIsUbo: boolean;
    repOwnershipPercentage?: number;

    kybStatus: KybStatus;
    kybReviewNote?: string;

    idDocUploaded: boolean;
    idDocUrl?: string;
    idDocExpiresAt?: string;
    // undefined = not checked (PDF upload, or OCR unavailable); true/false = declared rep's name
    // found (or not) in the document's OCR'd text — a hint for the admin, not a certified check.
    idDocNameMatch?: boolean;

    kbisUploaded: boolean;
    kbisUrl?: string;
    kbisExpiresAt?: string;

    proofOfAddressUploaded: boolean;
    proofOfAddressUrl?: string;
    proofOfAddressExpiresAt?: string;

    ribUploaded: boolean;
    ribUrl?: string;
    ribExpiresAt?: string;

    // Read-only SIRENE snapshot, for admin comparison against the declared fields above.
    sireneSiren?: string;
    sireneSiegeAddress?: string;
    sireneNatureJuridique?: string;
    sireneDirigeantsJson?: string;
}

export type KybDocumentLabel = 'legal_representative_id_doc' | 'kbis' | 'proof_of_address' | 'rib';

export interface KybDocumentUploadOptions {
    expiresAt?: string; // ISO date (yyyy-MM-dd)
}
