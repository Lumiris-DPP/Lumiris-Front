'use client';

import { useMemo, useState } from 'react';
import { FileCheck, Plus } from 'lucide-react';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent } from '@lumiris/ui/components/card';
import { DataTableFilters } from '@lumiris/ui/components/data-table-filters';
import { FeatureLayout } from '@lumiris/ui/components/feature-layout';
import { Toaster, toast } from '@lumiris/ui/components/sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { isApiError, useCertificateLibrary, useDeleteCertificate } from '@lumiris/api-client/react';
import type { CertificateLibraryItem, CertificateLibraryType } from '@lumiris/api-client';
import { EmptyState } from '@/features/empty-state';
import { DeleteCertificateDialog } from './delete-confirm-dialog';
import { UploadCertificateDialog } from './upload-dialog';

type TypeFilter = CertificateLibraryType | 'all';

const TYPE_LABEL: Record<CertificateLibraryType, string> = {
    ORIGIN: "Certificat d'origine",
    TRANSACTION: 'Certificat de transaction',
};

const TYPE_OPTIONS: ReadonlyArray<{ label: string; value: TypeFilter }> = [
    { label: 'Tous types', value: 'all' },
    { label: TYPE_LABEL.ORIGIN, value: 'ORIGIN' },
    { label: TYPE_LABEL.TRANSACTION, value: 'TRANSACTION' },
];

function formatDate(iso: string) {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso));
}

export function CertificateLibrary() {
    const { data: items = [], isLoading } = useCertificateLibrary();
    const deleteCertificate = useDeleteCertificate();

    const [search, setSearch] = useState('');
    const [type, setType] = useState<TypeFilter>('all');
    const [uploadOpen, setUploadOpen] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<CertificateLibraryItem | null>(null);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return items.filter((item) => {
            if (type !== 'all' && item.type !== type) return false;
            if (term && !(item.filename ?? '').toLowerCase().includes(term)) return false;
            return true;
        });
    }, [items, search, type]);

    function handleDelete() {
        if (!pendingDelete) return;
        const filename = pendingDelete.filename ?? 'Certificat';
        deleteCertificate.mutate(pendingDelete.id, {
            onSuccess: () => {
                toast.success('Certificat supprimé', { description: filename });
                setPendingDelete(null);
            },
            onError: (err) => {
                toast.error('Échec de la suppression', { description: isApiError(err) ? err.message : undefined });
                setPendingDelete(null);
            },
        });
    }

    if (!isLoading && items.length === 0) {
        return (
            <div className="p-8">
                <Toaster position="bottom-right" />
                <EmptyState
                    icon={FileCheck}
                    title="Aucun certificat dans votre bibliothèque"
                    description="Centralisez vos certificats d'origine et de transaction pour les réutiliser sur l'ensemble de vos passeports."
                    cta={{ label: 'Ajouter mon premier certificat', onClick: () => setUploadOpen(true) }}
                />
                <UploadCertificateDialog open={uploadOpen} onOpenChange={setUploadOpen} />
            </div>
        );
    }

    return (
        <div className="p-8">
            <Toaster position="bottom-right" />
            <FeatureLayout
                title="Certifications"
                actions={
                    <Button onClick={() => setUploadOpen(true)}>
                        <Plus className="mr-1.5 h-4 w-4" /> Ajouter un certificat
                    </Button>
                }
            >
                <div className="space-y-4">
                    <DataTableFilters
                        search={{ value: search, onChange: setSearch, placeholder: 'Nom de fichier…' }}
                        filters={[
                            {
                                label: 'Type',
                                value: type,
                                onChange: (v) => setType(v as TypeFilter),
                                options: TYPE_OPTIONS,
                            },
                        ]}
                        onReset={
                            search || type !== 'all'
                                ? () => {
                                      setSearch('');
                                      setType('all');
                                  }
                                : undefined
                        }
                    />

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fichier</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Ajouté le</TableHead>
                                        <TableHead>Utilisation</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="py-10 text-center text-sm text-muted-foreground"
                                            >
                                                Aucun certificat ne correspond aux filtres.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filtered.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    {item.url ? (
                                                        <a
                                                            href={item.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-sm text-foreground underline-offset-2 hover:underline"
                                                        >
                                                            {item.filename ?? 'Certificat'}
                                                        </a>
                                                    ) : (
                                                        <span className="text-sm text-foreground">
                                                            {item.filename ?? 'Certificat'}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{TYPE_LABEL[item.type]}</Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDate(item.createdAt)}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {item.usedOnDppCount > 0
                                                        ? `Utilisé sur ${item.usedOnDppCount} passeport${item.usedOnDppCount > 1 ? 's' : ''}`
                                                        : 'Non utilisé'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setPendingDelete(item)}
                                                    >
                                                        Supprimer
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </FeatureLayout>

            <UploadCertificateDialog open={uploadOpen} onOpenChange={setUploadOpen} />
            <DeleteCertificateDialog
                item={pendingDelete}
                onCancel={() => setPendingDelete(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
}
