'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { computeScore } from '@lumiris/core/scoring';
import { mockCertificates, mockPassportById } from '@lumiris/mock-data';
import type { Passport } from '@lumiris/types';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { Toaster } from '@lumiris/ui/components/sonner';
import { IrisScoreCard } from '@lumiris/scoring-ui';
import { useDppForm } from '@lumiris/api-client/react';
import type { DppFormDto } from '@lumiris/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { draftToPassport, useDraftStore } from '@/lib/draft-store';
import { dppToPassport } from '@/lib/passport-adapter';
import { CompositionCard, IdentityCard, ScoreAside, SustainabilityCard, TraceabilityCard } from './detail-cards';
import { DocumentsCard } from './documents-card';
import { EventFormCard } from './event-form-card';
import { EventHistoryCard } from './event-history-card';
import { QrCodeCard } from './QrCodeCard';
import { buildDetailView } from './view-model';

export function PassportDetail({ passportId }: { passportId: string }) {
    const artisan = useCurrentArtisan();
    const token = useAuthStore((s) => s.token);
    const drafts = useDraftStore((s) => s.drafts);
    const draft = drafts[passportId];

    const fixed = useMemo(() => mockPassportById(passportId), [passportId]);

    // Fetched only when this isn't a draft or mock passport.
    const dppQuery = useDppForm(passportId, { enabled: !draft && !fixed && Boolean(token) });
    const apiDpp: DppFormDto | null = dppQuery.data ?? null;
    const loading = dppQuery.isLoading;
    const notFound = dppQuery.isError;

    const apiPassport = useMemo<Passport | null>(
        () => (apiDpp ? dppToPassport(apiDpp, artisan.id) : null),
        [apiDpp, artisan.id],
    );

    const passport = useMemo<Passport | null>(() => {
        if (draft) return draftToPassport(draft);
        if (fixed) return fixed;
        return apiPassport;
    }, [draft, fixed, apiPassport]);

    const now = useMemo(() => new Date(), []);
    const score = useMemo(
        () => (passport ? computeScore(passport, { artisan, certificates: mockCertificates, now }) : null),
        [artisan, passport, now],
    );

    if (loading) {
        return <div className="text-muted-foreground p-8 text-sm">Chargement…</div>;
    }

    if (notFound || !passport) {
        return (
            <div className="p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>DPP introuvable</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline">
                            <Link href="/passports">
                                <ArrowLeft className="mr-1.5 h-4 w-4" /> Retour à la liste
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!score) return null;

    const view = buildDetailView(passport, apiDpp);

    return (
        <>
            <Toaster position="bottom-right" />
            <div className="grid gap-6 p-8 lg:grid-cols-[1fr_360px]">
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/passports">
                                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Liste
                            </Link>
                        </Button>
                        {view.apiStatus && (
                            <Badge variant={view.apiStatus === 'VALID' ? 'default' : 'destructive'}>
                                {view.apiStatus === 'VALID' ? 'Valide' : 'Invalide'}
                            </Badge>
                        )}
                    </div>

                    <IdentityCard view={view} />
                    <CompositionCard view={view} />
                    <TraceabilityCard view={view} />
                    <SustainabilityCard view={view} />
                    {apiDpp && (
                        <>
                            <DocumentsCard documents={apiDpp.documents ?? []} />
                            <EventFormCard passportId={passportId} />
                            <EventHistoryCard passportId={passportId} />
                        </>
                    )}
                </div>

                {apiDpp ? (
                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <IrisScoreCard dppId={passportId} />
                        {apiDpp.publicCode && <QrCodeCard publicCode={apiDpp.publicCode} />}
                    </aside>
                ) : (
                    <ScoreAside score={score} passport={passport} />
                )}
            </div>
        </>
    );
}
