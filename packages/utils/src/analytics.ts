export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export interface AnalyticsClient {
    track(name: string, properties?: AnalyticsProperties): void;
    identify(userId: string | null, traits?: AnalyticsProperties): void;
    page(name?: string, properties?: AnalyticsProperties): void;
}

export const noopAnalytics: AnalyticsClient = {
    track: () => {},
    identify: () => {},
    page: () => {},
};

export function createAnalytics(isProduction: boolean, prodClient: () => AnalyticsClient): AnalyticsClient {
    return isProduction ? prodClient() : noopAnalytics;
}
