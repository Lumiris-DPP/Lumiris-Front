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

    idDocUploaded: boolean;
    kbisUploaded: boolean;
    proofOfAddressUploaded: boolean;
    ribUploaded: boolean;

    // Read-only SIRENE snapshot, for admin comparison against the declared fields above.
    sireneSiren?: string;
    sireneSiegeAddress?: string;
    sireneNatureJuridique?: string;
    sireneDirigeantsJson?: string;
}

export type KybDocumentLabel = 'legal_representative_id_doc' | 'kbis' | 'proof_of_address' | 'rib';
