export type BlogCategory = 'regulation' | 'portrait_artisan' | 'savoir_faire' | 'mode_responsable' | 'guide_retouche';

export type BlogStatus = 'Draft' | 'Review' | 'Scheduled' | 'Published' | 'Archived';

export interface BlogArticle {
    id: string;
    title: string;
    slug: string;
    category: BlogCategory;
    status: BlogStatus;
    author: string;
    artisanId?: string;
    excerpt: string;
    body: string;
    coverImage?: string;
    readTime: string;

    metaTitle: string;
    metaDescription: string;
    ogImage?: string;

    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
    scheduledAt?: string;
}

export const BLOG_CATEGORY_LABEL: Record<BlogCategory, string> = {
    regulation: 'Réglementation',
    portrait_artisan: 'Portrait artisan',
    savoir_faire: 'Savoir-faire & matières',
    mode_responsable: 'Mode responsable',
    guide_retouche: 'Guide retouche',
};
