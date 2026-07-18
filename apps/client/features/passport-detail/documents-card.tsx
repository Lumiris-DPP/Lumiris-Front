'use client';

import { Download, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import type { DppFormDocument } from '@lumiris/api-client';

const DOC_TYPE_LABELS: Record<string, string> = {
    CARE_GUIDE: "Guide d'entretien avancé",
    ORIGIN_CERTIFICATES: "Certificats d'origine",
    REPAIR_MANUAL: 'Manuel de réparation technique',
    END_OF_LIFE_GUIDE: 'Instructions de recyclage / fin de vie',
    TEST_REPORTS: 'Rapports de test',
    TRANSACTION_CERTIFICATES: 'Certificats de transaction',
    CREATION_PASSPORT: 'Passeport de création',
    EU_DOC_OF_CONFORMITY: 'Déclaration UE de conformité',
    REACH_COMPLIANCE: 'Conformité REACH',
    SALE_INVOICE: 'Facture de vente',
};

const VISIBILITY_GROUPS: Array<{ key: string; label: string; description: string }> = [
    { key: 'PUBLIC_USERS', label: 'Documents publics', description: 'Accessibles à tous les consommateurs' },
    { key: 'CIRCULAR_OPERATORS', label: 'Fin de vie & Réparation', description: 'Ateliers de réparation, recycleurs' },
    { key: 'AUTHORITIES', label: 'Autorités compétentes', description: 'Douanes, autorités de marché' },
];

function DocumentRow({ doc }: { doc: DppFormDocument }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
                <FileText className="text-muted-foreground h-4 w-4 shrink-0" />
                <div className="min-w-0">
                    <p className="text-foreground truncate text-sm font-medium">
                        {DOC_TYPE_LABELS[doc.documentType ?? ''] ?? doc.documentType}
                    </p>
                    <p className="text-muted-foreground truncate text-[11px]">{doc.filename}</p>
                </div>
            </div>
            {doc.url && (
                <a
                    href={doc.url}
                    download={doc.filename ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                    aria-label={`Télécharger ${doc.filename ?? 'le document'}`}
                >
                    <Download className="h-4 w-4" />
                </a>
            )}
        </div>
    );
}

export function DocumentsCard({ documents }: { documents: DppFormDocument[] }) {
    if (documents.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {VISIBILITY_GROUPS.map(({ key, label, description }) => {
                    const group = documents.filter((d) => d.visibility === key);
                    if (group.length === 0) return null;
                    return (
                        <div key={key} className="space-y-2">
                            <div>
                                <p className="text-foreground text-sm font-medium">{label}</p>
                                <p className="text-muted-foreground text-[11px]">{description}</p>
                            </div>
                            <div className="space-y-1.5">
                                {group.map((doc, i) => (
                                    <DocumentRow key={doc.fileId ?? i} doc={doc} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
