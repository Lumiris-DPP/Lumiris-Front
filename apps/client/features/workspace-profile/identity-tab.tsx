'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { Separator } from '@lumiris/ui/components/separator';
import { Textarea } from '@lumiris/ui/components/textarea';
import { toast } from '@lumiris/ui/components/sonner';
import type { FrenchRegion } from '@lumiris/types';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { type ProfileSnapshot, useProfile, useProfileStore } from '@/lib/profile-store';
import { FRENCH_REGIONS, slugify } from './types';

const STORY_MAX = 600;

export function IdentityTab() {
    const artisan = useCurrentArtisan();
    const persisted = useProfile(artisan.id);
    const setOverride = useProfileStore((s) => s.setOverride);
    const resetOverride = useProfileStore((s) => s.resetOverride);

    const [draft, setDraft] = useState<ProfileSnapshot>(persisted);
    const [slug, setSlug] = useState(() => slugify(artisan.atelierName));
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        setDraft(persisted);
        setSlug(slugify(artisan.atelierName));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [artisan.id]);

    const dirty = useMemo(() => !sameProfile(draft, persisted), [draft, persisted]);

    useEffect(() => {
        if (!dirty) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [dirty]);

    const handlePhoto = (file: File | undefined) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setDraft((d) => ({ ...d, photoUrl: reader.result as string }));
            }
        };
        reader.readAsDataURL(file);
    };

    const addTag = () => {
        const t = tagInput.trim();
        if (!t || draft.specialities.includes(t)) return;
        setDraft((d) => ({ ...d, specialities: [...d.specialities, t] }));
        setTagInput('');
    };

    const removeTag = (t: string) => setDraft((d) => ({ ...d, specialities: d.specialities.filter((s) => s !== t) }));

    const onSave = () => {
        setOverride(artisan.id, {
            story: draft.story,
            city: draft.city,
            region: draft.region,
            specialities: draft.specialities,
            photoUrl: draft.photoUrl,
        });
        toast.success('Profil enregistré');
    };

    const onReset = () => {
        resetOverride(artisan.id);
        toast.info('Profil réinitialisé');
    };

    const storyLength = draft.story.length;
    const slugPreview = slug || slugify(artisan.atelierName) || 'votre-atelier';

    return (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="space-y-4">
                <Label>Photo de couverture</Label>
                <label className="border-border bg-muted/40 hover:bg-muted relative flex h-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed">
                    {draft.photoUrl ? (
                        <Image
                            src={draft.photoUrl}
                            alt="Aperçu de la photo de l'atelier"
                            fill
                            sizes="280px"
                            unoptimized
                            className="object-cover"
                        />
                    ) : (
                        <>
                            <ImagePlus className="text-muted-foreground mb-2 h-6 w-6" />
                            <p className="text-muted-foreground text-xs">Cliquez pour importer</p>
                        </>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        aria-label="Importer la photo de l'atelier"
                        className="absolute inset-0 cursor-pointer opacity-0"
                        onChange={(e) => handlePhoto(e.target.files?.[0])}
                    />
                </label>

                <Separator />
                <div className="space-y-2">
                    <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                        Identifiants
                    </p>
                    <dl className="text-sm">
                        <div className="flex justify-between py-1">
                            <dt className="text-muted-foreground">Atelier</dt>
                            <dd className="font-medium">{artisan.atelierName}</dd>
                        </div>
                        <div className="flex justify-between py-1">
                            <dt className="text-muted-foreground">Artisan</dt>
                            <dd className="font-medium">{artisan.displayName}</dd>
                        </div>
                        <div className="flex justify-between py-1">
                            <dt className="text-muted-foreground">ID</dt>
                            <dd className="font-mono text-xs">{artisan.id}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            <form
                className="space-y-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    onSave();
                }}
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="slug">Slug public</Label>
                        <Input
                            id="slug"
                            value={slug}
                            onChange={(e) => setSlug(slugify(e.target.value))}
                            placeholder="atelier-le-goff"
                        />
                        <p className="text-muted-foreground text-xs">
                            Aperçu : <span className="font-mono">lumiris.local/artisans/{slugPreview}</span>
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="city">Ville</Label>
                        <Input
                            id="city"
                            value={draft.city}
                            onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                        <Label htmlFor="region">Région</Label>
                        <Select
                            value={draft.region}
                            onValueChange={(v) => setDraft((d) => ({ ...d, region: v as FrenchRegion }))}
                        >
                            <SelectTrigger id="region">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {FRENCH_REGIONS.map((r) => (
                                    <SelectItem key={r} value={r}>
                                        {r}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Spécialités</Label>
                    <div className="flex flex-wrap gap-1.5">
                        {draft.specialities.length === 0 && (
                            <p className="text-muted-foreground text-xs">Aucune spécialité renseignée.</p>
                        )}
                        {draft.specialities.map((t) => (
                            <button
                                key={t}
                                type="button"
                                className="bg-lumiris-emerald/10 text-lumiris-emerald inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                                onClick={() => removeTag(t)}
                                aria-label={`Retirer ${t}`}
                            >
                                {t} <X className="h-3 w-3" />
                            </button>
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
                        <Button variant="outline" onClick={addTag} type="button">
                            Ajouter
                        </Button>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="story">Histoire de l&apos;atelier</Label>
                        <span className="text-muted-foreground text-xs tabular-nums">
                            {storyLength} / {STORY_MAX}
                        </span>
                    </div>
                    <Textarea
                        id="story"
                        rows={6}
                        maxLength={STORY_MAX}
                        value={draft.story}
                        onChange={(e) => setDraft((d) => ({ ...d, story: e.target.value }))}
                    />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                    <Button type="button" variant="ghost" onClick={onReset}>
                        Valeurs par défaut
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setDraft(persisted)} disabled={!dirty}>
                        Annuler
                    </Button>
                    <Button type="submit" disabled={!dirty}>
                        Enregistrer
                    </Button>
                </div>
            </form>
        </div>
    );
}

function sameProfile(a: ProfileSnapshot, b: ProfileSnapshot): boolean {
    if (a === b) return true;
    if (a.story !== b.story) return false;
    if (a.city !== b.city) return false;
    if (a.region !== b.region) return false;
    if (a.photoUrl !== b.photoUrl) return false;
    if (a.specialities.length !== b.specialities.length) return false;
    for (let i = 0; i < a.specialities.length; i++) {
        if (a.specialities[i] !== b.specialities[i]) return false;
    }
    return true;
}
