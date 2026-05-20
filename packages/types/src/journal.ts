export type JournalStatus = 'Draft' | 'Published' | 'Scheduled';

export type JournalCategory = 'reglementation' | 'portrait-artisan' | 'savoir-faire' | 'entretien';

export const JOURNAL_CATEGORY_LABEL: Record<JournalCategory, string> = {
    reglementation: 'Réglementation',
    'portrait-artisan': "Portrait d'artisan",
    'savoir-faire': 'Savoir-faire',
    entretien: 'Entretien',
};

export interface JournalArticle {
    id: string;
    title: string;
    category: JournalCategory;
    status: JournalStatus;
    author: string;
    createdAt: string;
    updatedAt: string;
    excerpt: string;
    readTime: string;
    body: string;
    coverImage?: string;
    slug?: string;
}
