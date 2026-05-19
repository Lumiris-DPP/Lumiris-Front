'use client';

import { memo, useMemo, useState } from 'react';
import { Archive, BookOpen, Filter, PlusCircle, Search, Send, Trash2, UploadCloud } from 'lucide-react';
import { mockArtisans, mockBlogArticles } from '@lumiris/mock-data';
import type { BlogArticle, BlogCategory, BlogStatus } from '@lumiris/types';
import { BLOG_CATEGORY_LABEL } from '@lumiris/types';
import { Avatar, AvatarFallback, AvatarImage } from '@lumiris/ui/components/avatar';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@lumiris/ui/components/alert-dialog';
import { Input } from '@lumiris/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { useToast } from '@lumiris/ui/hooks/use-toast';
import { cn } from '@lumiris/ui/lib/cn';
import { RequirePermission, useCurrentUser, useLogAction, usePermission } from '@/lib/auth';
import { isPublishable, validateForPublish } from '@/lib/blog-validation';
import { BlogEditor, StatusBadge } from './editor';

function BlogComponent() {
    return (
        <RequirePermission action="blog.read">
            <BlogInner />
        </RequirePermission>
    );
}

function BlogInner() {
    const { toast } = useToast();
    const log = useLogAction();
    const user = useCurrentUser();
    const canPublish = usePermission('blog.publish');
    const canArchive = usePermission('blog.archive');

    const [articles, setArticles] = useState<readonly BlogArticle[]>(mockBlogArticles);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<readonly string[]>([]);
    const [publishTarget, setPublishTarget] = useState<BlogArticle | null>(null);
    const [archiveTarget, setArchiveTarget] = useState<BlogArticle | null>(null);

    // List filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<BlogStatus | 'all'>('all');
    const [categoryFilter, setCategoryFilter] = useState<BlogCategory | 'all'>('all');
    const [authorFilter, setAuthorFilter] = useState<string>('all');
    const [artisanFilter, setArtisanFilter] = useState<string>('all');

    const editing = editingId ? (articles.find((a) => a.id === editingId) ?? null) : null;

    const authors = useMemo(() => Array.from(new Set(articles.map((a) => a.author))).sort(), [articles]);
    const artisanIdsInUse = useMemo(
        () => Array.from(new Set(articles.map((a) => a.artisanId).filter((id): id is string => !!id))),
        [articles],
    );

    const filtered = useMemo(() => {
        return articles.filter((a) => {
            if (statusFilter !== 'all' && a.status !== statusFilter) return false;
            if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
            if (authorFilter !== 'all' && a.author !== authorFilter) return false;
            if (artisanFilter !== 'all' && a.artisanId !== artisanFilter) return false;
            if (search.trim().length > 0) {
                const needle = search.toLowerCase();
                const haystack = `${a.title} ${a.excerpt} ${a.body}`.toLowerCase();
                if (!haystack.includes(needle)) return false;
            }
            return true;
        });
    }, [articles, search, statusFilter, categoryFilter, authorFilter, artisanFilter]);

    const handleCreate = () => {
        const id = `blog-fr-new-${Date.now()}`;
        const next: BlogArticle = {
            id,
            title: '',
            slug: '',
            category: 'savoir_faire',
            status: 'Draft',
            author: user.fullName,
            excerpt: '',
            body: '',
            readTime: '5 min',
            metaTitle: '',
            metaDescription: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setArticles((prev) => [next, ...prev]);
        setEditingId(id);
    };

    const handleSubmitForReview = (article: BlogArticle) => {
        setArticles((prev) =>
            prev.map((a) =>
                a.id === article.id ? { ...article, status: 'Review', updatedAt: new Date().toISOString() } : a,
            ),
        );
        toast({ title: 'Soumis en revue', description: article.title });
    };

    const handlePublish = (article: BlogArticle) => {
        if (!isPublishable(article, articles)) {
            toast({
                title: 'Publication bloquée',
                description: 'Corrigez les bloquants SEO/contenu avant publication.',
            });
            return;
        }
        const now = new Date().toISOString();
        setArticles((prev) =>
            prev.map((a) =>
                a.id === article.id
                    ? { ...article, status: 'Published', publishedAt: now, scheduledAt: undefined, updatedAt: now }
                    : a,
            ),
        );
        log({
            action: 'blog.publish',
            targetType: 'article',
            targetId: article.id,
            payload: {
                title: article.title,
                category: article.category,
                slug: article.slug,
                ...(article.artisanId ? { artisanId: article.artisanId } : {}),
            },
        });
        toast({ title: 'Article publié', description: article.title });
        setPublishTarget(null);
    };

    const handleArchive = (article: BlogArticle) => {
        const now = new Date().toISOString();
        setArticles((prev) =>
            prev.map((a) => (a.id === article.id ? { ...article, status: 'Archived', updatedAt: now } : a)),
        );
        log({
            action: 'blog.archive',
            targetType: 'article',
            targetId: article.id,
            payload: { title: article.title, reason: 'manual' },
        });
        toast({ title: 'Article archivé', description: article.title });
        setArchiveTarget(null);
    };

    if (editing) {
        return (
            <div className="space-y-5">
                <div className="flex items-baseline justify-between gap-3">
                    <div>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                            className="text-muted-foreground -ml-2"
                        >
                            ← Retour à la liste
                        </Button>
                        <h2 className="text-foreground mt-1 text-xl font-semibold">
                            {editing.title || 'Nouvel article'}
                        </h2>
                        <p className="text-muted-foreground text-xs">
                            {BLOG_CATEGORY_LABEL[editing.category]} · <StatusBadge status={editing.status} />
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {editing.status === 'Draft' ? (
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5"
                                onClick={() => handleSubmitForReview(editing)}
                            >
                                <Send className="h-3.5 w-3.5" /> Soumettre en revue
                            </Button>
                        ) : null}
                        {editing.status !== 'Archived' && editing.status !== 'Published' ? (
                            <Button
                                size="sm"
                                disabled={!canPublish || validationErrors.length > 0}
                                className="gap-1.5"
                                onClick={() => setPublishTarget(editing)}
                            >
                                <UploadCloud className="h-3.5 w-3.5" /> Publier
                            </Button>
                        ) : null}
                        {editing.status === 'Published' ? (
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={!canArchive}
                                onClick={() => setArchiveTarget(editing)}
                                className="gap-1.5"
                            >
                                <Archive className="h-3.5 w-3.5" /> Archiver
                            </Button>
                        ) : null}
                    </div>
                </div>

                <BlogEditor
                    article={editing}
                    siblings={articles}
                    onChange={(next) => setArticles((prev) => prev.map((a) => (a.id === next.id ? next : a)))}
                    onValidationChange={setValidationErrors}
                />

                <AlertDialog open={publishTarget !== null} onOpenChange={(o) => !o && setPublishTarget(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Publier &laquo;&nbsp;{publishTarget?.title}&nbsp;&raquo; ?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                L&apos;article sera publié immédiatement. Slug{' '}
                                <code className="bg-muted rounded px-1 font-mono">{publishTarget?.slug}</code>.
                                L&apos;action est tracée dans l&apos;audit log.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => publishTarget && handlePublish(publishTarget)}>
                                Publier maintenant
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={archiveTarget !== null} onOpenChange={(o) => !o && setArchiveTarget(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Archiver &laquo;&nbsp;{archiveTarget?.title}&nbsp;&raquo; ?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                L&apos;article ne sera plus visible côté public. Action tracée.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => archiveTarget && handleArchive(archiveTarget)}>
                                Archiver
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex items-baseline justify-between gap-3">
                <div>
                    <h2 className="text-foreground text-xl font-semibold">
                        <BookOpen className="text-lumiris-emerald mr-1.5 inline h-5 w-5" />
                        Blog - Journal LUMIRIS
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {articles.length} articles · 5 catégories · workflow Draft → Review → Published.
                    </p>
                </div>
                <Button size="sm" className="gap-1.5" onClick={handleCreate}>
                    <PlusCircle className="h-3.5 w-3.5" /> Nouvel article
                </Button>
            </div>

            <div className="border-border bg-card flex flex-wrap items-center gap-2 rounded-xl border p-3">
                <div className="min-w-55 relative flex-1">
                    <Search className="text-muted-foreground/60 absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Titre / corps…"
                        className="pl-8"
                    />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                    <SelectTrigger className="w-36">
                        <Filter className="mr-1 h-3.5 w-3.5" /> <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous statuts</SelectItem>
                        <SelectItem value="Draft">Brouillon</SelectItem>
                        <SelectItem value="Review">En revue</SelectItem>
                        <SelectItem value="Scheduled">Programmé</SelectItem>
                        <SelectItem value="Published">Publié</SelectItem>
                        <SelectItem value="Archived">Archivé</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}>
                    <SelectTrigger className="w-44">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes catégories</SelectItem>
                        {(Object.keys(BLOG_CATEGORY_LABEL) as BlogCategory[]).map((c) => (
                            <SelectItem key={c} value={c}>
                                {BLOG_CATEGORY_LABEL[c]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={authorFilter} onValueChange={setAuthorFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous auteurs</SelectItem>
                        {authors.map((a) => (
                            <SelectItem key={a} value={a}>
                                {a}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={artisanFilter} onValueChange={setArtisanFilter}>
                    <SelectTrigger className="w-44">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous artisans liés</SelectItem>
                        {artisanIdsInUse.map((id) => {
                            const a = mockArtisans.find((x) => x.id === id);
                            return (
                                <SelectItem key={id} value={id}>
                                    {a?.atelierName ?? id}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            </div>

            <div className="border-border bg-card overflow-hidden rounded-xl border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Article</TableHead>
                            <TableHead>Catégorie</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Auteur</TableHead>
                            <TableHead>Artisan lié</TableHead>
                            <TableHead className="text-right">MAJ</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((a) => {
                            const linkedArtisan = a.artisanId
                                ? mockArtisans.find((x) => x.id === a.artisanId)
                                : undefined;
                            const errors =
                                a.status !== 'Published' && a.status !== 'Archived'
                                    ? validateForPublish(a, articles)
                                    : [];
                            return (
                                <TableRow key={a.id} onClick={() => setEditingId(a.id)} className="cursor-pointer">
                                    <TableCell>
                                        <p className="text-foreground text-sm font-medium">
                                            {a.title || '- Sans titre -'}
                                        </p>
                                        <p className="text-muted-foreground line-clamp-1 text-[11px]">{a.excerpt}</p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-mono text-[10px]">
                                            {BLOG_CATEGORY_LABEL[a.category]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={a.status} />
                                        {a.scheduledAt && a.status === 'Scheduled' ? (
                                            <p className="text-lumiris-cyan mt-0.5 font-mono text-[10px]">
                                                {new Date(a.scheduledAt).toLocaleDateString('fr-FR')}
                                            </p>
                                        ) : null}
                                        {errors.length > 0 ? (
                                            <p className="text-lumiris-amber mt-0.5 font-mono text-[10px]">
                                                {errors.length} bloquant{errors.length > 1 ? 's' : ''}
                                            </p>
                                        ) : null}
                                    </TableCell>
                                    <TableCell className="text-xs">{a.author}</TableCell>
                                    <TableCell>
                                        {linkedArtisan ? (
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={linkedArtisan.photoUrl} alt="" />
                                                    <AvatarFallback className="text-[8px]">
                                                        {linkedArtisan.displayName.slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-foreground text-xs">
                                                    {linkedArtisan.atelierName}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground/50 text-xs">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-[11px]">
                                        {new Date(a.updatedAt).toLocaleDateString('fr-FR')}
                                    </TableCell>
                                    <TableCell className={cn('text-right')}>
                                        {a.status === 'Published' && canArchive ? (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setArchiveTarget(a);
                                                }}
                                            >
                                                <Archive className="h-3.5 w-3.5" />
                                            </Button>
                                        ) : a.status === 'Draft' ? (
                                            <Trash2 className="text-muted-foreground/30 ml-auto h-3.5 w-3.5" />
                                        ) : null}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-muted-foreground py-8 text-center text-xs">
                                    Aucun article ne correspond aux filtres.
                                </TableCell>
                            </TableRow>
                        ) : null}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={archiveTarget !== null} onOpenChange={(o) => !o && setArchiveTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Archiver &laquo;&nbsp;{archiveTarget?.title}&nbsp;&raquo; ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            L&apos;article ne sera plus visible côté public. Action tracée.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => archiveTarget && handleArchive(archiveTarget)}>
                            Archiver
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export const Blog = memo(BlogComponent);
