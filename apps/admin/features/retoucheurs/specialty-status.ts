import type { RepairerSpecialty } from '@lumiris/types';
import type { CandidatureStatus, LocalSubscriptionStatus } from './types';

export const SPECIALITY_LABEL: Record<RepairerSpecialty, string> = {
    alteration: 'Retouche',
    embroidery: 'Broderie',
    'shoe-repair': 'Cordonnerie',
    leather: 'Cuir',
    lining: 'Doublure',
    'electronics-repair': 'Électronique',
    'phone-repair': 'Téléphonie',
    'computer-repair': 'Informatique',
    cabinetmaking: 'Ébénisterie',
    upholstery: 'Tapisserie',
    'appliance-repair': 'Électroménager',
};

export const STATUS_LABEL: Record<CandidatureStatus, string> = {
    pending: 'À vérifier',
    verified: 'Vérifié',
    rejected: 'Rejeté',
};

export const STATUS_TONE: Record<CandidatureStatus, string> = {
    verified: 'border-lumiris-emerald/40 bg-lumiris-emerald/10 text-lumiris-emerald',
    pending: 'border-lumiris-amber/40 bg-lumiris-amber/10 text-lumiris-amber',
    rejected: 'border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose',
};

export const SUBSCRIPTION_TONE: Record<LocalSubscriptionStatus, { label: string; tone: string }> = {
    active: { label: 'Actif', tone: 'border-lumiris-emerald/40 bg-lumiris-emerald/10 text-lumiris-emerald' },
    paused: { label: 'En pause', tone: 'border-muted-foreground/40 bg-muted text-muted-foreground' },
    overdue: { label: 'Impayé', tone: 'border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose' },
    none: { label: 'Non abonné', tone: 'border-border bg-card text-muted-foreground' },
};
