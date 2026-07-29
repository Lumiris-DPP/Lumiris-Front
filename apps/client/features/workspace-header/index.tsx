'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@lumiris/ui/components/tooltip';
import { cn } from '@lumiris/ui/lib/cn';
import type { QuotaDto, SubscriptionDto } from '@lumiris/api-client';
import { NotificationsBell } from '@/features/notifications-bell';
import { UserMenu } from '@/features/user-menu';
import { useWorkspaceShell } from '@/features/workspace-shell';
import { useWorkspaceNotifications } from '@/features/workspace-shell/hooks';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { useSubscription } from '@/lib/use-subscription';

interface WorkspaceHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
}

export function WorkspaceHeader({ title, actions }: WorkspaceHeaderProps) {
    const { openSidebar } = useWorkspaceShell();
    const artisan = useCurrentArtisan();
    const notifications = useWorkspaceNotifications(artisan);
    const { subscription, quota, isRealMode } = useSubscription();

    return (
        <header className="sticky top-0 z-20 border-b border-border bg-card">
            {/* Hauteur alignée sur le bloc logo de la sidebar (px-5 py-5) pour la cohérence. */}
            <div className="flex items-center gap-3 px-5 py-5 md:gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Ouvrir le menu"
                    className="md:hidden"
                    onClick={openSidebar}
                >
                    <Menu className="h-5 w-5" />
                </Button>

                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">{title}</h1>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    {actions}
                    {isRealMode ? (
                        <QuotaBadge subscription={subscription} quota={quota} />
                    ) : (
                        <TierBadge tier={artisan.tier} />
                    )}
                    <NotificationsBell notifications={notifications} />
                    <UserMenu artisan={artisan} />
                </div>
            </div>
        </header>
    );
}

function QuotaBadge({ subscription, quota }: { subscription: SubscriptionDto | null; quota: QuotaDto | null }) {
    const active = Boolean(subscription?.active && quota?.hasActiveSubscription);
    const label = active && subscription ? subscription.tierLabel.replace('ATELIER ', '') : 'Sans abo';
    const usage = quota ? (quota.unlimited ? `${quota.used}/∞` : `${quota.used}/${quota.limit ?? '—'}`) : '';
    const nearLimit = active && quota && !quota.unlimited && quota.limit ? quota.used / quota.limit >= 0.9 : false;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Link
                    href="/subscription"
                    className={cn(
                        'flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10px] font-semibold uppercase',
                        !active && 'bg-lumiris-amber/15 text-lumiris-amber',
                        active && !nearLimit && 'bg-lumiris-emerald/15 text-lumiris-emerald',
                        active && nearLimit && 'bg-lumiris-amber/15 text-lumiris-amber',
                    )}
                >
                    {label}
                    {active && <span className="font-mono normal-case">{usage}</span>}
                </Link>
            </TooltipTrigger>
            <TooltipContent>
                {active ? `Passeports : ${usage} — voir l’abonnement` : 'Aucun abonnement actif — souscrire'}
            </TooltipContent>
        </Tooltip>
    );
}

function TierBadge({ tier }: { tier: 'Solo' | 'Studio' | 'Maison' }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Link
                    href="/subscription"
                    className={cn(
                        'rounded-md px-2 py-1 font-mono text-[10px] font-semibold uppercase',
                        tier === 'Solo' && 'bg-tier-solo/15 text-tier-solo',
                        tier === 'Studio' && 'bg-tier-studio/15 text-tier-studio',
                        tier === 'Maison' && 'bg-tier-maison/15 text-tier-maison',
                    )}
                >
                    {tier}
                </Link>
            </TooltipTrigger>
            <TooltipContent>Plan {tier} — voir l’abonnement</TooltipContent>
        </Tooltip>
    );
}
