'use client';

import { useState } from 'react';
import type { DppEventActorType } from '@lumiris/api-client';
import { useCreateDppEvent } from '@lumiris/api-client/react';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { Input } from '@lumiris/ui/components/input';
import { Textarea } from '@lumiris/ui/components/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { ACTOR_LABELS } from './event-history-card';

export function EventFormCard({ passportId }: { passportId: string }) {
    const createEvent = useCreateDppEvent(passportId);

    const [occurredAt, setOccurredAt] = useState('');
    const [description, setDescription] = useState('');
    const [actorType, setActorType] = useState<DppEventActorType | ''>('');

    const canSubmit = occurredAt !== '' && description.trim() !== '' && actorType !== '';

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit || createEvent.isPending) return;
        createEvent.mutate(
            {
                occurredAt: new Date(occurredAt).toISOString(),
                description: description.trim(),
                actorType: actorType as DppEventActorType,
            },
            {
                onSuccess: () => {
                    setOccurredAt('');
                    setDescription('');
                    setActorType('');
                },
            },
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ajouter un événement</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                            <label
                                htmlFor="event-occurred-at"
                                className="text-muted-foreground text-[11px] uppercase tracking-wider"
                            >
                                Date de l&apos;événement
                            </label>
                            <Input
                                id="event-occurred-at"
                                type="datetime-local"
                                value={occurredAt}
                                max={new Date().toISOString().slice(0, 16)}
                                onChange={(e) => setOccurredAt(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-[11px] uppercase tracking-wider">Acteur</span>
                            <Select value={actorType} onValueChange={(v) => setActorType(v as DppEventActorType)}>
                                <SelectTrigger aria-label="Acteur" className="w-full">
                                    <SelectValue placeholder="Sélectionner un acteur" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(ACTOR_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label
                            htmlFor="event-description"
                            className="text-muted-foreground text-[11px] uppercase tracking-wider"
                        >
                            Description
                        </label>
                        <Textarea
                            id="event-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Quelle modification a été apportée au produit ?"
                            rows={4}
                            className="min-h-24 resize-y"
                        />
                    </div>
                    {createEvent.isError && (
                        <p className="text-sm text-red-500">L&apos;événement n&apos;a pas pu être enregistré.</p>
                    )}
                    <div className="flex justify-end">
                        <Button type="submit" disabled={!canSubmit || createEvent.isPending}>
                            {createEvent.isPending ? 'Ajout…' : 'Ajouter'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
