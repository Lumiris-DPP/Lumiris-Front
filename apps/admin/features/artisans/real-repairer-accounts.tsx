'use client';

import { useMemo, useState } from 'react';
import { DownloadCloud, FileSearch } from 'lucide-react';
import {
    isApiError,
    useAdminRepairersAll,
    useImportRepairerDirectory,
    useInviteRepairer,
    useMarkRepairerKybIncomplete,
    useMarkRepairerKybOngoing,
    useRejectRepairer,
    useVerifyRepairer,
} from '@lumiris/api-client/react';
import type { RepairerProfileResponse, RepairerStatus } from '@lumiris/api-client';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Input } from '@lumiris/ui/components/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { useToast } from '@lumiris/ui/hooks/use-toast';
import { usePermission } from '@/lib/auth/permissions';
import { EmptyState } from '../_shared/empty-state';
import { KybComparisonDrawer } from '../kyb-review/comparison-drawer';

type StateFilter = 'all' | 'UNCLAIMED' | 'PENDING' | 'VERIFIED';

const STATE_TABS: Array<{ value: StateFilter; label: string }> = [
    { value: 'all', label: 'Tous' },
    { value: 'UNCLAIMED', label: 'Fiches annuaire' },
    { value: 'PENDING', label: 'En vérification' },
    { value: 'VERIFIED', label: 'Vérifiés' },
];

const ACCOUNT_STATUS_LABEL: Record<RepairerStatus, string> = {
    PENDING: 'En attente',
    VERIFIED: 'Vérifié',
    REJECTED: 'Rejeté',
    UNCLAIMED: 'Fiche annuaire',
    SUSPENDED: 'Suspendu',
};

const ACCOUNT_STATUS_TONE: Record<RepairerStatus, string> = {
    PENDING: 'border-lumiris-amber/40 bg-lumiris-amber/10 text-lumiris-amber',
    VERIFIED: 'border-lumiris-emerald/40 bg-lumiris-emerald/10 text-lumiris-emerald',
    REJECTED: 'border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose',
    UNCLAIMED: 'border-border bg-muted text-muted-foreground',
    SUSPENDED: 'border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose',
};

function formatSiret(siret?: string) {
    return siret ? siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4') : '—';
}

// Real repairer accounts + directory listings (backend). Tabs by state, SIRENE import, and an
// "Inviter" action to send the claim email for unclaimed directory listings.
export function RealRepairerAccounts() {
    const { toast } = useToast();
    const canVerify = usePermission('retoucheur.kyc_verify');
    const canReject = usePermission('retoucheur.kyc_reject');
    const [selected, setSelected] = useState<RepairerProfileResponse | null>(null);

    const { data: accounts = [], isLoading } = useAdminRepairersAll();
    const verifyRepairer = useVerifyRepairer();
    const rejectRepairer = useRejectRepairer();
    const markOngoing = useMarkRepairerKybOngoing();
    const markIncomplete = useMarkRepairerKybIncomplete();
    const importDirectory = useImportRepairerDirectory();
    const inviteRepairer = useInviteRepairer();

    const [stateFilter, setStateFilter] = useState<StateFilter>('all');
    const [importDepts, setImportDepts] = useState('75, 92, 93');

    const filtered = useMemo(
        () => (stateFilter === 'all' ? accounts : accounts.filter((a) => a.status === stateFilter)),
        [accounts, stateFilter],
    );

    const counts = useMemo(() => {
        const c: Record<string, number> = { all: accounts.length };
        for (const a of accounts) c[a.status] = (c[a.status] ?? 0) + 1;
        return c;
    }, [accounts]);

    function name(acc: RepairerProfileResponse) {
        return acc.companyName ?? acc.displayName ?? acc.userEmail ?? 'Réparateur';
    }

    function runImport() {
        const departments = importDepts
            .split(',')
            .map((d) => d.trim())
            .filter(Boolean);
        importDirectory.mutate(
            { source: 'SIRENE', departments },
            {
                onSuccess: (r) =>
                    toast({
                        title: 'Import SIRENE terminé',
                        description: `${r.created} créée(s), ${r.updated} mise(s) à jour, ${r.skipped} ignorée(s).`,
                    }),
                onError: (err) =>
                    toast({
                        title: "Échec de l'import",
                        description: isApiError(err) ? err.message : undefined,
                        variant: 'destructive',
                    }),
            },
        );
    }

    function invite(acc: RepairerProfileResponse) {
        const email = window.prompt(`E-mail professionnel de ${name(acc)} :`)?.trim();
        if (!email) return;
        inviteRepairer.mutate(
            { id: acc.id, email },
            {
                onSuccess: () => toast({ title: 'Invitation envoyée', description: email }),
                onError: (err) =>
                    toast({
                        title: "Échec de l'invitation",
                        description: isApiError(err) ? err.message : undefined,
                        variant: 'destructive',
                    }),
            },
        );
    }

    function approve(req: RepairerProfileResponse) {
        verifyRepairer.mutate(req.id, {
            onSuccess: () => {
                toast({ title: `${name(req)} approuvé`, description: 'Un e-mail de confirmation a été envoyé.' });
                setSelected(null);
            },
            onError: (err) =>
                toast({
                    title: 'Échec de la validation',
                    description: isApiError(err) ? err.message : undefined,
                    variant: 'destructive',
                }),
        });
    }

    function reject(req: RepairerProfileResponse) {
        const reason = window.prompt(`Motif du refus pour ${name(req)} (optionnel) :`) ?? undefined;
        rejectRepairer.mutate(
            { id: req.id, reason },
            {
                onSuccess: () => {
                    toast({
                        title: `${name(req)} rejeté`,
                        description: 'Le réparateur a été notifié par e-mail.',
                        variant: 'destructive',
                    });
                    setSelected(null);
                },
                onError: (err) =>
                    toast({
                        title: 'Échec du rejet',
                        description: isApiError(err) ? err.message : undefined,
                        variant: 'destructive',
                    }),
            },
        );
    }

    function markOngoingAction(req: RepairerProfileResponse) {
        markOngoing.mutate(req.id, {
            onError: (err) =>
                toast({
                    title: 'Échec',
                    description: isApiError(err) ? err.message : undefined,
                    variant: 'destructive',
                }),
        });
    }

    function markIncompleteAction(req: RepairerProfileResponse) {
        const reason = window.prompt(`Qu'est-ce qui manque pour ${name(req)} ?`) ?? undefined;
        if (reason === undefined) return;
        markIncomplete.mutate(
            { id: req.id, reason },
            {
                onSuccess: () => {
                    toast({ title: 'Dossier renvoyé', description: `${name(req)} a été notifié par e-mail.` });
                    setSelected(null);
                },
                onError: (err) =>
                    toast({
                        title: 'Échec',
                        description: isApiError(err) ? err.message : undefined,
                        variant: 'destructive',
                    }),
            },
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1 text-xs">
                    {STATE_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            onClick={() => setStateFilter(tab.value)}
                            className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                                stateFilter === tab.value
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground'
                            }`}
                        >
                            {tab.label}
                            <span className="ml-1 text-muted-foreground">{counts[tab.value] ?? 0}</span>
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        value={importDepts}
                        onChange={(e) => setImportDepts(e.target.value)}
                        placeholder="Départements (75, 92…)"
                        className="h-8 w-44 text-xs"
                        aria-label="Départements à importer"
                    />
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={runImport}
                        disabled={importDirectory.isPending}
                        className="h-8 gap-1.5"
                    >
                        <DownloadCloud className="h-3.5 w-3.5" />
                        {importDirectory.isPending ? 'Import…' : 'Importer SIRENE'}
                    </Button>
                </div>
            </div>

            {!isLoading && filtered.length === 0 ? (
                <EmptyState
                    title="Aucune fiche"
                    description={
                        stateFilter === 'all'
                            ? "Aucun réparateur pour l'instant — lancez un import."
                            : 'Aucune fiche dans cet état.'
                    }
                    icon={FileSearch}
                />
            ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader stickyHeader>
                                <TableRow>
                                    <TableHead>Réparateur</TableHead>
                                    <TableHead>SIRET</TableHead>
                                    <TableHead>Compte</TableHead>
                                    <TableHead>Dossier KYB</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((acc) => {
                                    const isUnclaimed = acc.status === 'UNCLAIMED' || !acc.userEmail;
                                    return (
                                        <TableRow key={acc.id}>
                                            <TableCell>
                                                <p className="text-sm font-medium text-foreground">{name(acc)}</p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {acc.userEmail ??
                                                        (acc.source ? `Annuaire ${acc.source}` : 'Sans compte')}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-xs">{formatSiret(acc.siret)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`font-mono text-[10px] ${ACCOUNT_STATUS_TONE[acc.status]}`}
                                                >
                                                    {ACCOUNT_STATUS_LABEL[acc.status]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs text-muted-foreground">
                                                    {acc.kyb?.termsAcceptedAt ? acc.kyb.kybStatus : 'Non soumis'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end">
                                                    {isUnclaimed ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => invite(acc)}
                                                            disabled={inviteRepairer.isPending}
                                                            className="h-8 gap-1.5"
                                                        >
                                                            <DownloadCloud className="h-3.5 w-3.5 rotate-180" />
                                                            Inviter
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setSelected(acc)}
                                                            className="h-8 gap-1.5"
                                                        >
                                                            <FileSearch className="h-3.5 w-3.5" />
                                                            Voir le dossier KYB
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            <KybComparisonDrawer
                open={selected != null}
                onClose={() => setSelected(null)}
                title={selected ? name(selected) : 'Dossier'}
                subtitle={selected?.userEmail}
                siret={selected?.siret}
                kyb={selected?.kyb}
                onApprove={() => selected && approve(selected)}
                onReject={() => selected && reject(selected)}
                onMarkOngoing={() => selected && markOngoingAction(selected)}
                onMarkIncomplete={() => selected && markIncompleteAction(selected)}
                approving={verifyRepairer.isPending}
                rejecting={rejectRepairer.isPending}
                markingOngoing={markOngoing.isPending}
                markingIncomplete={markIncomplete.isPending}
                canApprove={canVerify}
                canReject={canReject}
            />
        </div>
    );
}
