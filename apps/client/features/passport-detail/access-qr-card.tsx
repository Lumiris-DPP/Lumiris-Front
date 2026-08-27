'use client';

import { Download } from 'lucide-react';
import type { DppAccessLevel, DppFormDocument } from '@lumiris/api-client';
import { useDppAccessTokens } from '@lumiris/api-client/react';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lumiris/ui/components/tabs';
import { cn } from '@lumiris/ui/lib/cn';
import { ACCESS_LEVELS, ACCESS_LEVEL_ORDER, documentsForLevel, publicPassportUrl } from './access-levels';
import { AccessQr } from './access-qr';

interface AccessQrCardProps {
    dppId: string;
    publicCode: string;
    documents: DppFormDocument[];
}

/**
 * Les trois QR du passeport. Ils existent dès la publication et ne changent jamais : rien à
 * générer, rien à révoquer, rien qui expire — seul le niveau d'accès distingue les trois.
 */
export function AccessQrCard({ dppId, publicCode, documents }: AccessQrCardProps) {
    const tokensQuery = useDppAccessTokens(dppId);
    const tokenByLevel = new Map(tokensQuery.data?.map((t) => [t.accessLevel, t.token]));

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle className="text-base">QR codes d&apos;accès</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="PUBLIC">
                    <TabsList className="grid w-full grid-cols-3">
                        {ACCESS_LEVEL_ORDER.map((level) => {
                            const { label, icon: Icon } = ACCESS_LEVELS[level];
                            return (
                                <TabsTrigger key={level} value={level} className="gap-1.5 text-xs">
                                    <Icon className="h-3.5 w-3.5" />
                                    {label}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>

                    {ACCESS_LEVEL_ORDER.map((level) => (
                        <TabsContent key={level} value={level} className="pt-4">
                            <LevelPanel
                                level={level}
                                dppId={dppId}
                                publicCode={publicCode}
                                token={tokenByLevel.get(level) ?? null}
                                documents={documents}
                                loading={tokensQuery.isLoading}
                            />
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    );
}

function LevelPanel({
    level,
    dppId,
    publicCode,
    token,
    documents,
    loading,
}: {
    level: DppAccessLevel;
    dppId: string;
    publicCode: string;
    token: string | null;
    documents: DppFormDocument[];
    loading: boolean;
}) {
    const meta = ACCESS_LEVELS[level];
    const count = documentsForLevel(documents, level).length;

    // Un niveau élargi sans jeton serait un QR public déguisé : mieux vaut ne rien afficher.
    if (loading || (level !== 'PUBLIC' && !token)) {
        return <p className="py-8 text-center text-xs text-muted-foreground">Chargement…</p>;
    }

    const url = publicPassportUrl(publicCode, token);

    return (
        <div className="flex flex-col items-center gap-4">
            <AccessQr url={url} filename={`qr-${meta.label.toLowerCase()}-${publicCode}`} />

            <div className="flex flex-col items-center gap-1.5 text-center">
                <Badge variant="outline" className={cn('text-[10px]', meta.badgeClass)}>
                    {meta.label}
                </Badge>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {meta.audience}
                    <br />
                    {count === 0
                        ? 'Aucun document à ce niveau'
                        : `${count} document${count > 1 ? 's' : ''} accessible${count > 1 ? 's' : ''}`}
                </p>
            </div>

            {level === 'PUBLIC' && (
                <>
                    <div className="flex flex-col items-center gap-1 text-center">
                        <p className="text-[11px] tracking-wider text-muted-foreground uppercase">Code DPP</p>
                        <p className="font-mono text-lg font-semibold tracking-widest">{publicCode}</p>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => window.open(`/print/passport/${dppId}`, '_blank')}
                    >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Télécharger le PDF
                    </Button>
                </>
            )}
        </div>
    );
}
