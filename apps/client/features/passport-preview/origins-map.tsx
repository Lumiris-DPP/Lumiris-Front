import type { Material, ProductionStep } from '@lumiris/types';
import { findCountry } from '@lumiris/utils';
import { FIBER_LABEL, STAGE_LABEL } from '@lumiris/scoring-ui';

interface OriginsMapProps {
    materials: readonly Material[];
    steps: readonly ProductionStep[];
}

const VIEW_W = 800;
const VIEW_H = 400;

function project(lat: number, lng: number): { x: number; y: number } {
    const x = ((lng + 180) / 360) * VIEW_W;
    const y = ((90 - lat) / 180) * VIEW_H;
    return { x, y };
}

interface AggCountry {
    code: string;
    label: string;
    x: number;
    y: number;
    materials: Array<{ fiberLabel: string; pct: number }>;
    steps: Array<{ stageLabel: string; city: string }>;
}

function aggregate(materials: readonly Material[], steps: readonly ProductionStep[]): AggCountry[] {
    const map = new Map<string, AggCountry>();

    const upsert = (code: string | undefined): AggCountry | null => {
        const country = findCountry(code);
        if (!country) {
            if (code && process.env.NODE_ENV !== 'production') {
                console.warn(`[OriginsMap] pays inconnu: ${code}`);
            }
            return null;
        }
        if (country.latitude == null || country.longitude == null) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn(`[OriginsMap] coordonnées manquantes: ${country.code}`);
            }
            return null;
        }
        let agg = map.get(country.code);
        if (!agg) {
            const { x, y } = project(country.latitude, country.longitude);
            agg = { code: country.code, label: country.label, x, y, materials: [], steps: [] };
            map.set(country.code, agg);
        }
        return agg;
    };

    for (const m of materials) {
        const agg = upsert(m.originCountry);
        if (!agg) continue;
        agg.materials.push({
            fiberLabel: FIBER_LABEL[m.fiber],
            pct: m.percentage,
        });
    }

    for (const s of steps) {
        const agg = upsert(s.locationCountry);
        if (!agg) continue;
        agg.steps.push({
            stageLabel: STAGE_LABEL[s.kind],
            city: s.locationCity,
        });
    }

    return Array.from(map.values());
}

export function OriginsMap({ materials, steps }: OriginsMapProps) {
    if (materials.length === 0 && steps.length === 0) return null;

    const agg = aggregate(materials, steps);

    if (agg.length === 0) {
        return <p className="text-muted-foreground text-sm">Origines non renseignées.</p>;
    }

    return (
        <div className="border-border bg-card overflow-hidden rounded-2xl border">
            <svg
                viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="Carte des origines matières et lieux de fabrication"
                className="bg-muted block h-auto w-full"
            >
                <g fill="var(--background)" opacity="0.85">
                    <path d="M 50 60 L 90 50 L 175 50 L 240 65 L 290 100 L 280 145 L 250 175 L 220 185 L 180 175 L 145 165 L 110 140 L 75 110 L 55 85 Z" />
                    <path d="M 245 195 L 285 195 L 315 220 L 320 270 L 295 320 L 270 335 L 250 320 L 240 285 L 235 240 Z" />
                    <path d="M 380 75 L 420 65 L 470 70 L 495 95 L 480 120 L 445 130 L 410 125 L 385 115 Z" />
                    <path d="M 405 145 L 460 140 L 500 165 L 510 210 L 490 260 L 460 290 L 440 290 L 420 265 L 405 230 L 395 195 L 395 165 Z" />
                    <path d="M 490 65 L 560 55 L 660 60 L 740 70 L 790 95 L 790 145 L 750 175 L 700 190 L 640 185 L 580 175 L 530 160 L 500 130 L 485 100 Z" />
                    <path d="M 595 165 L 615 165 L 620 195 L 605 210 L 595 195 Z" />
                    <path d="M 685 250 L 740 245 L 780 260 L 790 290 L 750 305 L 700 300 L 680 280 Z" />
                </g>

                {agg.map((c) => {
                    const hasMaterials = c.materials.length > 0;
                    const hasSteps = c.steps.length > 0;
                    const both = hasMaterials && hasSteps;
                    const matX = both ? c.x - 7 : c.x;
                    const stepX = both ? c.x + 7 : c.x;
                    const matTip = hasMaterials
                        ? `${c.label} — ${c.materials.map((m) => `${m.fiberLabel} ${m.pct}%`).join(', ')}`
                        : '';
                    const stepTip = hasSteps
                        ? `${c.label} — ${c.steps.map((s) => `${s.stageLabel}${s.city ? ` (${s.city})` : ''}`).join(', ')}`
                        : '';
                    return (
                        <g key={c.code}>
                            {hasMaterials && (
                                <circle
                                    cx={matX}
                                    cy={c.y}
                                    r={6}
                                    fill="var(--lumiris-cyan)"
                                    stroke="var(--background)"
                                    strokeWidth={1.5}
                                >
                                    <title>{matTip}</title>
                                </circle>
                            )}
                            {hasSteps && (
                                <polygon
                                    points={`${stepX},${c.y - 6} ${stepX + 6},${c.y + 5} ${stepX - 6},${c.y + 5}`}
                                    fill="var(--lumiris-amber)"
                                    stroke="var(--background)"
                                    strokeWidth={1.5}
                                >
                                    <title>{stepTip}</title>
                                </polygon>
                            )}
                        </g>
                    );
                })}
            </svg>

            <div className="border-border/60 space-y-3 border-t p-4">
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="bg-lumiris-cyan inline-block h-2.5 w-2.5 rounded-full" aria-hidden />
                        Matières premières
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span
                            className="bg-lumiris-amber inline-block h-2.5 w-2.5"
                            style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}
                            aria-hidden
                        />
                        Lieux de fabrication
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                    {agg.map((c) => (
                        <span
                            key={c.code}
                            className="border-border bg-background text-foreground rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider"
                        >
                            {c.code}
                        </span>
                    ))}
                </div>
                <ul className="text-muted-foreground space-y-1 text-xs sm:hidden">
                    {agg.map((c) => (
                        <li key={c.code}>
                            <span className="text-foreground font-medium">{c.label}</span>
                            {c.materials.length > 0 && (
                                <span> — {c.materials.map((m) => `${m.fiberLabel} ${m.pct}%`).join(', ')}</span>
                            )}
                            {c.steps.length > 0 && (
                                <span>
                                    {c.materials.length > 0 ? ' · ' : ' — '}
                                    {c.steps.map((s) => `${s.stageLabel}${s.city ? ` (${s.city})` : ''}`).join(', ')}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
