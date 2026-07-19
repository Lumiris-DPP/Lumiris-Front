import type { MarketplaceProductStatus } from '@lumiris/api-client';

export const STATUSES: readonly MarketplaceProductStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

export const STATUS_LABEL: Record<MarketplaceProductStatus, string> = {
    DRAFT: 'Brouillon',
    PUBLISHED: 'Publié',
    ARCHIVED: 'Archivé',
};
