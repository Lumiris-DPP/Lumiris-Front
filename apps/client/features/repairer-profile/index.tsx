'use client';

import { useEffect, useState } from 'react';
import { useRepairerMe, useUpdateRepairerProfile } from '@lumiris/api-client/react';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { FeatureLayout } from '@lumiris/ui/components/feature-layout';
import { Input } from '@lumiris/ui/components/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lumiris/ui/components/tabs';
import { Textarea } from '@lumiris/ui/components/textarea';
import { toast } from '@lumiris/ui/components/sonner';

const STATUS_LABEL: Record<string, string> = {
    PENDING: 'En attente de vérification',
    VERIFIED: 'Vérifié',
    REJECTED: 'Rejeté',
    UNCLAIMED: 'Fiche annuaire',
    SUSPENDED: 'Suspendu',
};

function splitList(value: string): string[] {
    return value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
}

export function RepairerProfile() {
    const { data: repairer, isLoading } = useRepairerMe();

    if (isLoading) {
        return <p className="p-8 text-sm text-muted-foreground">Chargement du profil…</p>;
    }
    if (!repairer) {
        return <p className="p-8 text-sm text-muted-foreground">Profil indisponible.</p>;
    }

    return (
        <div className="p-4 md:p-8">
            <FeatureLayout
                title="Profil du réparateur"
                description="Identité et fiche publique visible des clients VISION."
            >
                <Tabs defaultValue="identity">
                    <TabsList>
                        <TabsTrigger value="identity">Identité</TabsTrigger>
                        <TabsTrigger value="vitrine">Vitrine publique</TabsTrigger>
                    </TabsList>
                    <TabsContent value="identity" className="pt-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between gap-3">
                                <CardTitle>{repairer.companyName ?? repairer.displayName ?? 'Mon atelier'}</CardTitle>
                                <Badge variant="outline" className="font-mono text-[10px]">
                                    {STATUS_LABEL[repairer.status] ?? repairer.status}
                                </Badge>
                            </CardHeader>
                            <CardContent className="grid gap-1 text-sm text-muted-foreground">
                                <span>SIRET : {repairer.siret ?? '—'}</span>
                                <span>
                                    Note moyenne : {repairer.averageRating?.toFixed(1) ?? '—'} ({repairer.reviewCount}{' '}
                                    avis)
                                </span>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="vitrine" className="pt-4">
                        <VitrineForm
                            displayName={repairer.displayName}
                            city={repairer.city}
                            region={repairer.region}
                            address={repairer.address}
                            specialties={repairer.specialties}
                            zones={repairer.zones}
                            schedule={repairer.schedule}
                        />
                    </TabsContent>
                </Tabs>
            </FeatureLayout>
        </div>
    );
}

function VitrineForm({
    displayName: initialDisplayName,
    city: initialCity,
    region: initialRegion,
    address: initialAddress,
    specialties: initialSpecialties,
    zones: initialZones,
    schedule: initialSchedule,
}: {
    displayName?: string;
    city?: string;
    region?: string;
    address?: string;
    specialties?: string[];
    zones?: string[];
    schedule?: string;
}) {
    const updateProfile = useUpdateRepairerProfile();

    const [displayName, setDisplayName] = useState(initialDisplayName ?? '');
    const [specialties, setSpecialties] = useState((initialSpecialties ?? []).join(', '));
    const [zones, setZones] = useState((initialZones ?? []).join(', '));
    const [schedule, setSchedule] = useState(initialSchedule ?? '');
    const [address, setAddress] = useState(initialAddress ?? '');
    const [city, setCity] = useState(initialCity ?? '');
    const [region, setRegion] = useState(initialRegion ?? '');

    useEffect(() => {
        setDisplayName(initialDisplayName ?? '');
        setSpecialties((initialSpecialties ?? []).join(', '));
        setZones((initialZones ?? []).join(', '));
        setSchedule(initialSchedule ?? '');
        setAddress(initialAddress ?? '');
        setCity(initialCity ?? '');
        setRegion(initialRegion ?? '');
    }, [
        initialDisplayName,
        initialSpecialties,
        initialZones,
        initialSchedule,
        initialAddress,
        initialCity,
        initialRegion,
    ]);

    function onSubmit(e: React.SyntheticEvent) {
        e.preventDefault();
        updateProfile.mutate(
            {
                displayName: displayName.trim() || undefined,
                specialties: splitList(specialties),
                zones: splitList(zones),
                schedule: schedule.trim() || undefined,
                address: address.trim() || undefined,
                city: city.trim() || undefined,
                region: region.trim() || undefined,
            },
            {
                onSuccess: () => toast.success('Profil mis à jour.'),
                onError: () => toast.error('Impossible de mettre à jour le profil.'),
            },
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Fiche publique</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                    <Field label="Nom affiché">
                        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Ville">
                            <Input value={city} onChange={(e) => setCity(e.target.value)} />
                        </Field>
                        <Field label="Région">
                            <Input value={region} onChange={(e) => setRegion(e.target.value)} />
                        </Field>
                    </div>
                    <Field label="Adresse">
                        <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                    </Field>
                    <Field label="Spécialités (séparées par une virgule)">
                        <Input
                            value={specialties}
                            onChange={(e) => setSpecialties(e.target.value)}
                            placeholder="cordonnerie, maroquinerie"
                        />
                    </Field>
                    <Field label="Zones d'intervention (séparées par une virgule)">
                        <Input
                            value={zones}
                            onChange={(e) => setZones(e.target.value)}
                            placeholder="Paris 3e, Paris 4e"
                        />
                    </Field>
                    <Field label="Horaires">
                        <Textarea
                            value={schedule}
                            onChange={(e) => setSchedule(e.target.value)}
                            rows={3}
                            placeholder="Lun-Sam 9h-19h"
                        />
                    </Field>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={updateProfile.isPending}>
                            {updateProfile.isPending ? 'Enregistrement…' : 'Enregistrer'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[11px] tracking-wider text-muted-foreground uppercase">{label}</span>
            {children}
        </div>
    );
}
