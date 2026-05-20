import type { RegulatorySector } from '@/lib/regulatory-calendar';

/** En V1, seul `textile` est actif — les autres sont en placeholder. */
export interface SectorView {
    sector: RegulatorySector;
    label: string;
    enabled: boolean;
    placeholderHint?: string;
}
