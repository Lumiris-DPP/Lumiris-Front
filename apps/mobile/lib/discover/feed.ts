import type { IrisGrade, JournalCategory } from '@lumiris/types';
import { mockJournalPublic, type JournalArticlePublic } from '@lumiris/mock-data';

export interface DiscoverFeedItem {
    slug: string;
    title: string;
    subtitle: string;
    category: JournalCategory;
    grade: IrisGrade;
    publishedAt: string;
    readTime: string;
    author: string;
    coverImage?: string;
}

const CATEGORY_GRADE: Record<JournalCategory, IrisGrade> = {
    'portrait-artisan': 'A',
    'savoir-faire': 'B',
    entretien: 'C',
    reglementation: 'D',
};

const GRADE_RANK: Record<IrisGrade, number> = { A: 0, B: 1, C: 2, D: 3, E: 4 };

export function articleToFeedItem(article: JournalArticlePublic): DiscoverFeedItem {
    return {
        slug: article.slug,
        title: article.title,
        subtitle: article.excerpt,
        category: article.category,
        grade: CATEGORY_GRADE[article.category],
        publishedAt: article.updatedAt,
        readTime: article.readTime,
        author: article.author,
        coverImage: article.coverImage,
    };
}

export function getDiscoverFeed(): DiscoverFeedItem[] {
    return mockJournalPublic.map(articleToFeedItem).sort((a, b) => {
        const rankDiff = GRADE_RANK[a.grade] - GRADE_RANK[b.grade];
        if (rankDiff !== 0) return rankDiff;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
}

export function gradeForCategory(category: JournalCategory): IrisGrade {
    return CATEGORY_GRADE[category];
}

export const JOURNAL_CATEGORIES_ORDERED: readonly JournalCategory[] = [
    'portrait-artisan',
    'savoir-faire',
    'entretien',
    'reglementation',
];
