export interface DashboardRecentPassport {
    id: string;
    productName: string | null;
    status: 'DRAFT' | 'VALID' | 'INVALID';
    grade: string | null;
    score: number;
    updatedAt: string | null;
}

export interface DashboardInfoDto {
    artisanName: string;
    artisanPhotoUrl: string | null;
    profileComplete: boolean;
    published: number;
    inCompletion: number;
    drafts: number;
    averageIrisScore: number;
    gradeDistribution: Record<string, number>;
    recentPassports: DashboardRecentPassport[];
    quotaUsed: number;
    /** null = illimité */
    quotaLimit: number | null;
    expiringCertificates: number;
    supplierInvoices: number;
}
