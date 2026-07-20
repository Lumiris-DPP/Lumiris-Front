export interface AtelierStatsTotals {
    scans: number;
    views: number;
    suggestionClicks: number;
    conversions: number;
}

export interface AtelierStatsPassportBreakdown {
    dppFormId: string;
    publicCode: string;
    productName: string | null;
    scans: number;
    views: number;
    suggestionClicks: number;
    conversions: number;
}

export interface AtelierStatsResponse {
    from: string;
    to: string;
    totals: AtelierStatsTotals;
    advancedLocked: boolean;
    byPassport: AtelierStatsPassportBreakdown[];
}

export interface AtelierStatsQuery {
    from?: string;
    to?: string;
}

export type TrackEventType = 'SCAN' | 'VIEW' | 'SUGGESTION_CLICK' | 'CONVERSION';

export interface TrackEventRequest {
    publicCode: string;
    type: TrackEventType;
}
