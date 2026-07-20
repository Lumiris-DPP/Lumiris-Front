'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, ExternalLink, ImagePlus, Loader2, Trash2, X } from 'lucide-react';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Separator } from '@lumiris/ui/components/separator';
import { Textarea } from '@lumiris/ui/components/textarea';
import { toast } from '@lumiris/ui/components/sonner';
import {
    useArtisanMe,
    useAddArtisanPhoto,
    usePublishArtisanVitrine,
    useRemoveArtisanPhoto,
    useUpdateArtisanVitrine,
} from '@lumiris/api-client/react';

const STORY_MAX = 600;

interface Draft {
    atelierName: string;
    story: string;
    method: string;
    journey: string;
    specialties: string[];
    city: string;
    region: string;
    websiteUrl: string;
    links: Record<string, string>;
}

const EMPTY_DRAFT: Draft = {
    atelierName: '',
    story: '',
    method: '',
    journey: '',
    specialties: [],
    city: '',
    region: '',
    websiteUrl: '',
    links: {},
};

export function VitrineTab() {
    const { data: profile, isLoading } = useArtisanMe();
    const updateMutation = useUpdateArtisanVitrine();
    const addPhotoMutation = useAddArtisanPhoto();
    const removePhotoMutation = useRemoveArtisanPhoto();
    const publishMutation = usePublishArtisanVitrine();

    const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
    const [tagInput, setTagInput] = useState('');
    const [linkLabel, setLinkLabel] = useState('');
    const [linkUrl, setLinkUrl] = useState('');

    useEffect(() => {
        if (!profile) return;
        setDraft({
            atelierName: profile.atelierName ?? '',
            story: profile.story ?? '',
            method: profile.method ?? '',
            journey: profile.journey ?? '',
            specialties: profile.specialties ?? [],
            city: profile.city ?? '',
            region: profile.region ?? '',
            websiteUrl: profile.websiteUrl ?? '',
            links: profile.links ?? {},
        });
    }, [profile]);

    if (isLoading) {
        return <p className="text-muted-foreground text-sm">Chargement…</p>;
    }
    if (!profile) {
        return <p className="text-muted-foreground text-sm">Profil artisan introuvable.</p>;
    }

    const isVerified = profile.status === 'VERIFIED';

    const addTag = () => {
        const t = tagInput.trim();
        if (!t || draft.specialties.includes(t)) return;
        setDraft((d) => ({ ...d, specialties: [...d.specialties, t] }));
        setTagInput('');
    };
    const removeTag = (t: string) => setDraft((d) => ({ ...d, specialties: d.specialties.filter((s) => s !== t) }));

    const addLink = () => {
        const label = linkLabel.trim();
        const url = linkUrl.trim();
        if (!label || !url) return;
        setDraft((d) => ({ ...d, links: { ...d.links, [label]: url } }));
        setLinkLabel('');
        setLinkUrl('');
    };
    const removeLink = (label: string) =>
        setDraft((d) => {
            const { [label]: _removed, ...rest } = d.links;
            return { ...d, links: rest };
        });

    const handleSave = () => {
        updateMutation.mutate(draft, {
            onSuccess: () => toast.success('Vitrine enregistrée'),
            onError: () => toast.error('Échec de l’enregistrement'),
        });
    };

    const handlePhotoUpload = (file: File | undefined) => {
        if (!file) return;
        addPhotoMutation.mutate(file, {
            onError: () => toast.error('Échec de l’envoi de la photo'),
        });
    };

    const handlePublish = () => {
        publishMutation.mutate(undefined, {
            onSuccess: (p) => toast.success(p.slug ? `Vitrine publiée : /artisan/${p.slug}` : 'Vitrine publiée'),
            onError: () => toast.error('Échec de la publication'),
        });
    };

    return (
        <div className="space-y-6">
            {!isVerified ? (
                <p className="border-border bg-muted/40 text-muted-foreground rounded-lg border p-3 text-xs">
                    Votre profil doit être vérifié (KYB) avant de pouvoir publier votre vitrine publique. Vous pouvez
                    déjà préparer son contenu.
                </p>
            ) : null}

            {profile.published && profile.slug ? (
                <p className="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
                    <ExternalLink className="h-3 w-3" />
                    Vitrine publique :{' '}
                    <span className="text-foreground font-mono text-xs">/artisans/{profile.slug}</span>
                </p>
            ) : null}

            <div className="space-y-2">
                <Label>Photos d&apos;atelier</Label>
                <div className="flex flex-wrap gap-3">
                    {profile.photos.map((photo) => (
                        <div key={photo.id} className="group relative h-24 w-24 overflow-hidden rounded-lg">
                            <Image src={photo.url} alt="" fill sizes="96px" className="object-cover" />
                            <button
                                type="button"
                                onClick={() => removePhotoMutation.mutate(photo.id)}
                                disabled={removePhotoMutation.isPending}
                                aria-label="Supprimer la photo"
                                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    <label className="border-border bg-muted/40 hover:bg-muted relative flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed">
                        {addPhotoMutation.isPending ? (
                            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                        ) : (
                            <ImagePlus className="text-muted-foreground h-5 w-5" />
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            aria-label="Ajouter une photo"
                            className="absolute inset-0 cursor-pointer opacity-0"
                            onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
                            disabled={addPhotoMutation.isPending}
                        />
                    </label>
                </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="atelierName">Nom de l&apos;atelier</Label>
                    <Input
                        id="atelierName"
                        value={draft.atelierName}
                        onChange={(e) => setDraft((d) => ({ ...d, atelierName: e.target.value }))}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                        id="city"
                        value={draft.city}
                        onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="region">Région</Label>
                    <Input
                        id="region"
                        value={draft.region}
                        onChange={(e) => setDraft((d) => ({ ...d, region: e.target.value }))}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="websiteUrl">Site web</Label>
                    <Input
                        id="websiteUrl"
                        type="url"
                        placeholder="https://…"
                        value={draft.websiteUrl}
                        onChange={(e) => setDraft((d) => ({ ...d, websiteUrl: e.target.value }))}
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <Label htmlFor="story">Histoire de l&apos;atelier</Label>
                    <span className="text-muted-foreground text-xs tabular-nums">
                        {draft.story.length} / {STORY_MAX}
                    </span>
                </div>
                <Textarea
                    id="story"
                    rows={5}
                    maxLength={STORY_MAX}
                    value={draft.story}
                    onChange={(e) => setDraft((d) => ({ ...d, story: e.target.value }))}
                />
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="method">Méthode</Label>
                <Textarea
                    id="method"
                    rows={4}
                    value={draft.method}
                    onChange={(e) => setDraft((d) => ({ ...d, method: e.target.value }))}
                    placeholder="Techniques, savoir-faire, matières travaillées…"
                />
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="journey">Parcours</Label>
                <Textarea
                    id="journey"
                    rows={4}
                    value={draft.journey}
                    onChange={(e) => setDraft((d) => ({ ...d, journey: e.target.value }))}
                    placeholder="Formation, expériences, création de l’atelier…"
                />
            </div>

            <div className="space-y-2">
                <Label>Spécialités</Label>
                <div className="flex flex-wrap gap-1.5">
                    {draft.specialties.length === 0 && (
                        <p className="text-muted-foreground text-xs">Aucune spécialité renseignée.</p>
                    )}
                    {draft.specialties.map((t) => (
                        <Badge key={t} variant="secondary" className="gap-1">
                            {t}
                            <button type="button" onClick={() => removeTag(t)} aria-label={`Retirer ${t}`}>
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Ex. tissage main"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addTag();
                            }
                        }}
                    />
                    <Button variant="outline" type="button" onClick={addTag}>
                        Ajouter
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Liens</Label>
                <div className="flex flex-col gap-1.5">
                    {Object.entries(draft.links).map(([label, url]) => (
                        <div key={label} className="flex items-center justify-between gap-2 text-sm">
                            <span>
                                <span className="font-medium">{label}</span>{' '}
                                <span className="text-muted-foreground">{url}</span>
                            </span>
                            <button
                                type="button"
                                onClick={() => removeLink(label)}
                                aria-label={`Retirer ${label}`}
                                className="text-muted-foreground hover:text-destructive"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <Input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Instagram" />
                    <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" />
                    <Button variant="outline" type="button" onClick={addLink}>
                        Ajouter
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <Button asChild type="button" variant="ghost">
                    <Link href="/preview/vitrine" target="_blank" rel="noopener noreferrer">
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> Aperçu
                    </Link>
                </Button>
                <Button type="button" onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={handlePublish}
                    disabled={!isVerified || publishMutation.isPending || profile.published}
                >
                    {profile.published ? 'Déjà publiée' : publishMutation.isPending ? 'Publication…' : 'Publier'}
                </Button>
            </div>
        </div>
    );
}
