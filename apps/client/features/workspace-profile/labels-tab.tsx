'use client';

import { useMemo, useState } from 'react';
import { Paperclip } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Separator } from '@lumiris/ui/components/separator';
import { Switch } from '@lumiris/ui/components/switch';
import { toast } from '@lumiris/ui/components/sonner';
import { cn } from '@lumiris/ui/lib/cn';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { useProfile, useProfileStore } from '@/lib/profile-store';
import { SUPPORTED_LABELS, type LabelConfig } from './types';

type LabelExtras = Record<string, { expiresAt: string; certificateName: string }>;

export function LabelsTab() {
    const artisan = useCurrentArtisan();
    const profile = useProfile(artisan.id);
    const setOverride = useProfileStore((s) => s.setOverride);

    const persistedFlags = useMemo(
        () => ({ epv: profile.epvLabeled, ofg: profile.ofgLabeled }),
        [profile.epvLabeled, profile.ofgLabeled],
    );
    const [extraFlags, setExtraFlags] = useState<Record<string, boolean>>({});
    const [extras, setExtras] = useState<LabelExtras>({});

    const isOn = (key: LabelConfig['key']): boolean => {
        if (key === 'epv') return persistedFlags.epv;
        if (key === 'ofg') return persistedFlags.ofg;
        return extraFlags[key] ?? false;
    };

    const toggle = (key: LabelConfig['key'], value: boolean) => {
        if (key === 'epv') {
            setOverride(artisan.id, { epvLabeled: value });
        } else if (key === 'ofg') {
            setOverride(artisan.id, { ofgLabeled: value });
        } else {
            setExtraFlags((s) => ({ ...s, [key]: value }));
        }
        toast.success(value ? 'Label activé' : 'Label désactivé');
    };

    const updateExtra = (key: string, patch: Partial<LabelExtras[string]>) =>
        setExtras((s) => ({
            ...s,
            [key]: { expiresAt: '', certificateName: '', ...s[key], ...patch },
        }));

    return (
        <div className="space-y-1">
            <p className="mb-4 text-sm text-muted-foreground">
                EPV et OFG influencent le sous-score Savoir-faire (axe 25%). Les autres labels enrichissent la fiche
                publique.
            </p>

            {SUPPORTED_LABELS.map((label, idx) => {
                const on = isOn(label.key);
                const extra = extras[label.key];
                return (
                    <div key={label.key}>
                        {idx > 0 && <Separator />}
                        <div className="space-y-3 py-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <span className={cn('h-2 w-2 rounded-full', label.dot)} aria-hidden="true" />
                                    <div>
                                        <p className="text-sm font-medium">{label.name}</p>
                                        <p className="text-xs text-muted-foreground">{label.description}</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={on}
                                    onCheckedChange={(v) => toggle(label.key, v)}
                                    aria-label={`Activer ${label.name}`}
                                />
                            </div>

                            {on && (
                                <div className="grid gap-3 pl-5 md:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor={`exp-${label.key}`} className="text-xs">
                                            Date de fin de validité
                                        </Label>
                                        <Input
                                            id={`exp-${label.key}`}
                                            type="date"
                                            value={extra?.expiresAt ?? ''}
                                            onChange={(e) => updateExtra(label.key, { expiresAt: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Certificat</Label>
                                        <div className="flex items-center gap-2">
                                            <Button asChild variant="outline" size="sm" className="cursor-pointer">
                                                <label>
                                                    <Paperclip className="mr-1.5 h-3.5 w-3.5" />
                                                    {extra?.certificateName ? 'Remplacer' : 'Joindre'}
                                                    <input
                                                        type="file"
                                                        accept="application/pdf,image/*"
                                                        aria-label={`Joindre un certificat pour ${label.name}`}
                                                        className="hidden"
                                                        onChange={(e) =>
                                                            updateExtra(label.key, {
                                                                certificateName: e.target.files?.[0]?.name ?? '',
                                                            })
                                                        }
                                                    />
                                                </label>
                                            </Button>
                                            {extra?.certificateName && (
                                                <span className="truncate font-mono text-xs text-muted-foreground">
                                                    {extra.certificateName}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
