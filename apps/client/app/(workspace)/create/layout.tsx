import { RequireSubscription } from '@/features/subscription-gate/require-subscription';

// La création / mise à jour d'un DPP requiert un abonnement actif
export default function CreateLayout({ children }: { children: React.ReactNode }) {
    return <RequireSubscription>{children}</RequireSubscription>;
}
