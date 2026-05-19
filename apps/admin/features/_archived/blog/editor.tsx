'use client';

import { useMemo, useRef, useState } from 'react';
import {
    AlertTriangle,
    Bold,
    Calendar,
    CalendarClock,
    Eye,
    Image as ImageIcon,
    Italic,
    Link as LinkIcon,
    List,
    Save,
} from 'lucide-react';
import { mockArtisans } from '@lumiris/mock-data';
import type { BlogArticle, BlogCategory, BlogStatus } from '@lumiris/types';
import { BLOG_CATEGORY_LABEL } from '@lumiris/types';
import { Avatar, AvatarFallback, AvatarImage } from '@lumiris/ui/components/avatar';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@lumiris/ui/components/command';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Popover, PopoverContent, PopoverTrigger } from '@lumiris/ui/components/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { Switch } from '@lumiris/ui/components/switch';
import { Textarea } from '@lumiris/ui/components/textarea';
import { cn } from '@lumiris/ui/lib/cn';
import { validateForPublish } from '@/lib/blog-validation';

interface BlogEditorProps {
    article: BlogArticle;
    /** Tous les articles existants - utilisé pour valider l'unicité du slug. */
    siblings: readonly BlogArticle[];
    onChange: (next: BlogArticle) => void;
    /** Renvoie la liste des erreurs bloquantes pour la publication. */
    onValidationChange?: (errors: readonly string[]) => void;
    readOnly?: boolean;
}

interface ToolbarAction {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    /** Insère du markdown autour de la sélection courante. */
    wrap?: { before: string; after: string };
    /** Insère un bloc à la position du curseur. */
    insertLine?: string;
}

const TOOLBAR: readonly ToolbarAction[] = [
    { icon: Bold, label: 'Gras', wrap: { before: '**', after: '**' } },
    { icon: Italic, label: 'Italique', wrap: { before: '*', after: '*' } },
    { icon: List, label: 'Liste', insertLine: '\n- ' },
    { icon: ImageIcon, label: 'Image', wrap: { before: '![alt](', after: ')' } },
    { icon: LinkIcon, label: 'Lien', wrap: { before: '[texte](', after: ')' } },
];

export function BlogEditor({ article, siblings, onChange, onValidationChange, readOnly = false }: BlogEditorProps) {
    const bodyRef = useRef<HTMLTextAreaElement | null>(null);
    const [showSchedule, setShowSchedule] = useState(!!article.scheduledAt);

    const errors = useMemo(() => validateForPublish(article, siblings), [article, siblings]);

    // Notifie le parent des erreurs (sans setState pour éviter les boucles).
    const lastReported = useRef<string>('');
    const serialized = errors.join('|');
    if (serialized !== lastReported.current) {
        lastReported.current = serialized;
        onValidationChange?.(errors);
    }

    const update = <K extends keyof BlogArticle>(key: K, value: BlogArticle[K]) => {
        onChange({ ...article, [key]: value, updatedAt: new Date().toISOString() });
    };

    const applyToolbar = (action: ToolbarAction) => {
        if (readOnly) return;
        const ta = bodyRef.current;
        if (!ta) return;
        const { selectionStart, selectionEnd, value } = ta;
        if (action.wrap) {
            const wrap = action.wrap;
            const selected = value.slice(selectionStart, selectionEnd);
            const next =
                value.slice(0, selectionStart) + wrap.before + selected + wrap.after + value.slice(selectionEnd);
            update('body', next);
            queueMicrotask(() => {
                ta.focus();
                const cursor = selectionStart + wrap.before.length + selected.length;
                ta.setSelectionRange(cursor, cursor);
            });
        } else if (action.insertLine !== undefined) {
            const line = action.insertLine;
            const next = value.slice(0, selectionStart) + line + value.slice(selectionEnd);
            update('body', next);
            queueMicrotask(() => {
                ta.focus();
                const cursor = selectionStart + line.length;
                ta.setSelectionRange(cursor, cursor);
            });
        }
    };

    const linkedArtisan = mockArtisans.find((a) => a.id === article.artisanId);

    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
                <Field label="Titre" hint={`${article.title.length} / 80 caractères`}>
                    <Input
                        value={article.title}
                        onChange={(e) => update('title', e.target.value)}
                        readOnly={readOnly}
                        placeholder="Titre de l'article"
                        className={cn(article.title.length > 80 && 'border-lumiris-rose')}
                    />
                </Field>

                <Field label="Extrait" hint={`${article.excerpt.length} caractères`}>
                    <Textarea
                        value={article.excerpt}
                        onChange={(e) => update('excerpt', e.target.value)}
                        readOnly={readOnly}
                        placeholder="Une à deux phrases pour la liste publique."
                        rows={2}
                    />
                </Field>

                <div className="border-border bg-card rounded-xl border p-3">
                    <div className="border-border flex items-center gap-1 border-b pb-2">
                        {TOOLBAR.map((a) => (
                            <Button
                                key={a.label}
                                size="sm"
                                variant="ghost"
                                onClick={() => applyToolbar(a)}
                                disabled={readOnly}
                                className="h-7 px-2"
                                title={a.label}
                            >
                                <a.icon className="h-3.5 w-3.5" />
                            </Button>
                        ))}
                        <span className="text-muted-foreground ml-auto font-mono text-[10px]">
                            {article.body.length} caractères
                        </span>
                    </div>
                    <Textarea
                        ref={bodyRef}
                        value={article.body}
                        onChange={(e) => update('body', e.target.value)}
                        readOnly={readOnly}
                        placeholder="Corps de l'article (markdown light : **gras**, *italique*, - liste, [lien](url))…"
                        rows={20}
                        className="mt-2 border-0 bg-transparent shadow-none focus-visible:ring-0"
                    />
                </div>
            </div>

            <aside className="space-y-4">
                {errors.length > 0 ? (
                    <div className="border-lumiris-rose/30 bg-lumiris-rose/5 rounded-xl border p-3 text-xs">
                        <p className="text-lumiris-rose inline-flex items-center gap-1.5 font-semibold">
                            <AlertTriangle className="h-3.5 w-3.5" /> Bloquants pré-publish
                        </p>
                        <ul className="text-muted-foreground mt-1.5 list-disc space-y-0.5 pl-4">
                            {errors.map((err) => (
                                <li key={err}>{err}</li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="border-lumiris-emerald/30 bg-lumiris-emerald/5 rounded-xl border p-3 text-xs">
                        <p className="text-lumiris-emerald inline-flex items-center gap-1.5 font-semibold">
                            <Save className="h-3.5 w-3.5" /> Prêt pour publication
                        </p>
                    </div>
                )}

                <div className="border-border bg-card space-y-3 rounded-xl border p-4">
                    <p className="text-foreground text-xs font-semibold">Méta</p>

                    <Field label="Catégorie">
                        <Select
                            value={article.category}
                            onValueChange={(v) => update('category', v as BlogCategory)}
                            disabled={readOnly}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {(Object.keys(BLOG_CATEGORY_LABEL) as BlogCategory[]).map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {BLOG_CATEGORY_LABEL[c]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="Slug" hint="kebab-case, unique">
                        <Input
                            value={article.slug}
                            onChange={(e) => update('slug', e.target.value)}
                            readOnly={readOnly}
                            placeholder="url-friendly-slug"
                            className="font-mono"
                        />
                    </Field>

                    <Field label="Auteur">
                        <Input
                            value={article.author}
                            onChange={(e) => update('author', e.target.value)}
                            readOnly={readOnly}
                        />
                    </Field>

                    <Field label="Lien artisan (optionnel)">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start gap-2"
                                    disabled={readOnly}
                                >
                                    {linkedArtisan ? (
                                        <>
                                            <Avatar className="h-5 w-5">
                                                <AvatarImage src={linkedArtisan.photoUrl} alt="" />
                                                <AvatarFallback className="text-[8px]">
                                                    {linkedArtisan.displayName.slice(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-foreground truncate text-xs">
                                                {linkedArtisan.atelierName}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">Aucun artisan lié</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="w-72 p-0">
                                <Command>
                                    <CommandInput placeholder="Chercher un artisan…" />
                                    <CommandList>
                                        <CommandEmpty>Aucun résultat.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value="none"
                                                onSelect={() => onChange({ ...article, artisanId: undefined })}
                                            >
                                                <span className="text-muted-foreground">- Aucun lien -</span>
                                            </CommandItem>
                                            {mockArtisans.map((a) => (
                                                <CommandItem
                                                    key={a.id}
                                                    value={`${a.atelierName} ${a.displayName}`}
                                                    onSelect={() => onChange({ ...article, artisanId: a.id })}
                                                >
                                                    <Avatar className="h-5 w-5">
                                                        <AvatarImage src={a.photoUrl} alt="" />
                                                        <AvatarFallback className="text-[8px]">
                                                            {a.displayName.slice(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-foreground text-xs">{a.atelierName}</span>
                                                    <span className="text-muted-foreground ml-auto text-[10px]">
                                                        {a.tier}
                                                    </span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </Field>

                    <div className="flex items-center justify-between gap-2 pt-1">
                        <Label className="text-xs">
                            <CalendarClock className="text-muted-foreground mr-1 inline h-3.5 w-3.5" /> Programmer la
                            publication
                        </Label>
                        <Switch
                            checked={showSchedule}
                            onCheckedChange={(v) => {
                                setShowSchedule(v);
                                if (!v) onChange({ ...article, scheduledAt: undefined });
                            }}
                            disabled={readOnly}
                        />
                    </div>
                    {showSchedule ? (
                        <Field label="Date programmée">
                            <Input
                                type="datetime-local"
                                value={article.scheduledAt ? article.scheduledAt.slice(0, 16) : ''}
                                onChange={(e) => update('scheduledAt', new Date(e.target.value).toISOString())}
                                readOnly={readOnly}
                            />
                        </Field>
                    ) : null}
                </div>

                <div className="border-border bg-card space-y-3 rounded-xl border p-4">
                    <p className="text-foreground text-xs font-semibold">SEO</p>
                    <Field
                        label="Meta title"
                        hint={`${article.metaTitle.length} / 30-60`}
                        warn={
                            article.metaTitle.length > 0 &&
                            (article.metaTitle.length < 30 || article.metaTitle.length > 60)
                        }
                    >
                        <Input
                            value={article.metaTitle}
                            onChange={(e) => update('metaTitle', e.target.value)}
                            readOnly={readOnly}
                        />
                    </Field>
                    <Field
                        label="Meta description"
                        hint={`${article.metaDescription.length} / 80-160`}
                        warn={
                            article.metaDescription.length > 0 &&
                            (article.metaDescription.length < 80 || article.metaDescription.length > 160)
                        }
                    >
                        <Textarea
                            value={article.metaDescription}
                            onChange={(e) => update('metaDescription', e.target.value)}
                            readOnly={readOnly}
                            rows={3}
                        />
                    </Field>
                    <Field label="OG image (URL)">
                        <Input
                            value={article.ogImage ?? ''}
                            onChange={(e) => update('ogImage', e.target.value)}
                            readOnly={readOnly}
                            placeholder="https://…"
                            className="font-mono text-[11px]"
                        />
                    </Field>
                    <Field label="Cover image (URL)">
                        <Input
                            value={article.coverImage ?? ''}
                            onChange={(e) => update('coverImage', e.target.value)}
                            readOnly={readOnly}
                            placeholder="https://…"
                            className="font-mono text-[11px]"
                        />
                    </Field>
                </div>

                <Button asChild size="sm" variant="outline" className="w-full gap-1.5">
                    <a href={`/preview/blog?id=${article.id}`} target="_blank" rel="noreferrer">
                        <Eye className="h-3.5 w-3.5" /> Aperçu site WEB
                    </a>
                </Button>

                <p className="text-muted-foreground inline-flex items-center gap-1 font-mono text-[10px]">
                    <Calendar className="h-3 w-3" />
                    MAJ {new Date(article.updatedAt).toLocaleString('fr-FR')}
                </p>
            </aside>
        </div>
    );
}

function Field({
    label,
    hint,
    warn,
    children,
}: {
    label: string;
    hint?: string;
    warn?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
                <Label className="text-xs">{label}</Label>
                {hint ? (
                    <span
                        className={cn(
                            'font-mono text-[10px]',
                            warn ? 'text-lumiris-amber' : 'text-muted-foreground/70',
                        )}
                    >
                        {hint}
                    </span>
                ) : null}
            </div>
            {children}
        </div>
    );
}

// ─── Helpers exposés ────────────────────────────────────────────────────────

interface StatusBadgeStyles {
    label: string;
    tone: string;
}

const STATUS_STYLES: Record<BlogStatus, StatusBadgeStyles> = {
    Draft: { label: 'Brouillon', tone: 'border-muted-foreground/40 text-muted-foreground' },
    Review: {
        label: 'En revue',
        tone: 'border-lumiris-amber/40 text-lumiris-amber bg-lumiris-amber/5',
    },
    Scheduled: {
        label: 'Programmé',
        tone: 'border-lumiris-cyan/40 text-lumiris-cyan bg-lumiris-cyan/5',
    },
    Published: {
        label: 'Publié',
        tone: 'border-lumiris-emerald/40 text-lumiris-emerald bg-lumiris-emerald/5',
    },
    Archived: { label: 'Archivé', tone: 'border-muted-foreground/30 text-muted-foreground/70' },
};

export function StatusBadge({ status }: { status: BlogStatus }) {
    const s = STATUS_STYLES[status];
    return (
        <Badge variant="outline" className={cn('font-mono text-[10px]', s.tone)}>
            {s.label}
        </Badge>
    );
}
