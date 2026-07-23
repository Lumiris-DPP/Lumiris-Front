import { useParams } from 'react-router-dom';
import { journalArticleBySlug } from '@lumiris/mock-data';
import { JournalArticle, JournalArticleNotFound } from '@/features/journal-article';

export default function JournalArticleRoute() {
    const { slug } = useParams();
    const article = slug ? journalArticleBySlug(slug) : undefined;
    return article ? <JournalArticle article={article} /> : <JournalArticleNotFound />;
}
