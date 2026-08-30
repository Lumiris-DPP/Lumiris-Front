'use client';

import { useEffect, useState } from 'react';
import { Mail, RotateCw } from 'lucide-react';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { DataTableFilters } from '@lumiris/ui/components/data-table-filters';
import { FeatureLayout } from '@lumiris/ui/components/feature-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { useToast } from '@lumiris/ui/hooks/use-toast';
import { isApiError, useAdminEmailsList, useRetryEmail } from '@lumiris/api-client/react';
import type { EmailOutboxResponse, EmailOutboxStatus } from '@lumiris/api-client';
import { usePermission } from '@/lib/auth/permissions';
import { EmptyState } from '../_shared/empty-state';

// Le back pagine à taille fixe sans renvoyer de total : "page pleine" sert d'heuristique pour
// savoir s'il reste une page suivante, plutôt que d'ajouter un compte total côté back pour ça.
const PAGE_SIZE = 30;

const STATUS_OPTIONS = [
    { label: 'Tous les statuts', value: 'all' },
    { label: 'En attente', value: 'PENDING' },
    { label: 'Envoyé', value: 'SENT' },
    { label: 'Échec (DLQ)', value: 'DEAD' },
] as const;

const STATUS_BADGE: Record<EmailOutboxStatus, string> = {
    PENDING: 'border-lumiris-amber/40 bg-lumiris-amber/10 text-lumiris-amber',
    SENT: 'border-lumiris-emerald/40 bg-lumiris-emerald/10 text-lumiris-emerald',
    DEAD: 'border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose',
};

const STATUS_LABEL: Record<EmailOutboxStatus, string> = {
    PENDING: 'En attente',
    SENT: 'Envoyé',
    DEAD: 'Échec (DLQ)',
};

function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

export function EmailLogs() {
    const { toast } = useToast();
    const canRetry = usePermission('governance.read_audit_log');

    const [searchInput, setSearchInput] = useState('');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [status, setStatus] = useState<'all' | EmailOutboxStatus>('all');
    const [page, setPage] = useState(0);

    // Débounce léger : évite une requête par frappe sur le champ de recherche.
    useEffect(() => {
        const timeout = setTimeout(() => setRecipientEmail(searchInput.trim()), 300);
        return () => clearTimeout(timeout);
    }, [searchInput]);

    useEffect(() => {
        setPage(0);
    }, [recipientEmail, status]);

    const { data: emails = [], isLoading } = useAdminEmailsList({
        status: status === 'all' ? undefined : status,
        recipientEmail: recipientEmail || undefined,
        page,
    });
    const retryEmail = useRetryEmail();

    function retry(email: EmailOutboxResponse) {
        retryEmail.mutate(email.id, {
            onSuccess: () =>
                toast({
                    title: 'Email relancé',
                    description: `${email.subject} → ${email.recipientEmail}`,
                }),
            onError: (err) =>
                toast({
                    title: 'Échec de la relance',
                    description: isApiError(err) ? err.message : undefined,
                    variant: 'destructive',
                }),
        });
    }

    return (
        <FeatureLayout title="Emails" description="Log d'envoi des emails transactionnels">
            <div className="flex flex-col gap-4">
                <DataTableFilters
                    search={{
                        value: searchInput,
                        onChange: setSearchInput,
                        placeholder: 'Rechercher un destinataire…',
                    }}
                    filters={[
                        {
                            label: 'Statut',
                            value: status,
                            onChange: (value) => setStatus(value as 'all' | EmailOutboxStatus),
                            options: STATUS_OPTIONS,
                        },
                    ]}
                    onReset={
                        searchInput || status !== 'all'
                            ? () => {
                                  setSearchInput('');
                                  setStatus('all');
                              }
                            : undefined
                    }
                />

                {!isLoading && emails.length === 0 ? (
                    <EmptyState
                        icon={Mail}
                        title="Aucun email"
                        description="Rien ne correspond à ces filtres pour l'instant."
                    />
                ) : (
                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader stickyHeader>
                                    <TableRow>
                                        <TableHead>Destinataire</TableHead>
                                        <TableHead>Sujet</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead>Tentatives</TableHead>
                                        <TableHead>Créé</TableHead>
                                        <TableHead>Envoyé</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {emails.map((email) => (
                                        <TableRow key={email.id}>
                                            <TableCell>
                                                <span className="text-sm text-foreground">{email.recipientEmail}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="text-sm text-foreground">{email.subject}</p>
                                                    <p className="font-mono text-[11px] text-muted-foreground">
                                                        {email.template}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`font-mono text-[10px] ${STATUS_BADGE[email.status]}`}
                                                    title={email.lastError ?? undefined}
                                                >
                                                    {STATUS_LABEL[email.status]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs text-muted-foreground">
                                                    {email.attempts}/{email.maxAttempts}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDate(email.createdAt)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDate(email.sentAt)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end">
                                                    {email.status === 'DEAD' ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={!canRetry || retryEmail.isPending}
                                                            onClick={() => retry(email)}
                                                            className="h-8 gap-1.5"
                                                        >
                                                            <RotateCw className="h-3.5 w-3.5" />
                                                            Relancer
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 0}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                        Précédent
                    </Button>
                    <span className="text-xs text-muted-foreground">Page {page + 1}</span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={emails.length < PAGE_SIZE}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Suivant
                    </Button>
                </div>
            </div>
        </FeatureLayout>
    );
}
