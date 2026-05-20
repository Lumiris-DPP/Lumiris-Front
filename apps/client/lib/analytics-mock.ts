import { computeScore } from '@lumiris/core/scoring';
import { mockArtisanById, mockCertificates, mockPassportsByArtisan } from '@lumiris/mock-data';
import type { IrisGrade as IrisGradeLetter, Passport } from '@lumiris/types';

const PIVOT = new Date('2026-05-01').getTime();
const DAY_MS = 86_400_000;

function mulberry32(seed: number): () => number {
    let t = seed >>> 0;
    return () => {
        t = (t + 0x6d2b79f5) >>> 0;
        let r = Math.imul(t ^ (t >>> 15), t | 1);
        r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

function hashString(s: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
        h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
    }
    return h >>> 0;
}

interface ScansDataPoint {
    date: string;
    label: string;
    total: number;
    unique: number;
}

interface ScansSeries {
    points: ScansDataPoint[];
    totalScans: number;
    uniqueScans: number;
    topCountry: string;
    topDevice: string;
}

const COUNTRIES: readonly string[] = ['France', 'Belgique', 'Suisse', 'Allemagne'];
const DEVICES: readonly string[] = ['iOS Safari', 'Android Chrome', 'Desktop Safari'];

export function getScansSeries(artisanId: string, days = 30): ScansSeries {
    const rng = mulberry32(hashString(`scans:${artisanId}`));
    const points: ScansDataPoint[] = [];
    let totalScans = 0;
    let uniqueScans = 0;

    for (let i = days - 1; i >= 0; i--) {
        const dayMs = PIVOT - i * DAY_MS;
        const d = new Date(dayMs);
        const dow = d.getUTCDay();
        const isWeekend = dow === 0 || dow === 6;
        const base = 8 + Math.floor(rng() * 22);
        const total = Math.round(base * (isWeekend ? 1.3 : 1));
        const unique = Math.round(total * (0.55 + rng() * 0.2));
        const label = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
        const iso = d.toISOString().slice(0, 10);
        points.push({ date: iso, label, total, unique });
        totalScans += total;
        uniqueScans += unique;
    }

    const topCountry = COUNTRIES[Math.floor(rng() * COUNTRIES.length)] ?? 'France';
    const topDevice = DEVICES[Math.floor(rng() * DEVICES.length)] ?? 'iOS Safari';

    return { points, totalScans, uniqueScans, topCountry, topDevice };
}

const GRADE_WEIGHT: Record<IrisGradeLetter, number> = { A: 4, B: 2, C: 1, D: 0.3, E: 0.3 };

interface TopPassportRow {
    passport: Passport;
    grade: IrisGradeLetter;
    scans: number;
    conversions: number;
}

function publishedPassports(artisanId: string): readonly Passport[] {
    return mockPassportsByArtisan(artisanId).filter((p) => p.status === 'Published');
}

export function getTopPassports(artisanId: string, limit = 5): readonly TopPassportRow[] {
    const artisan = mockArtisanById(artisanId);
    if (!artisan) return [];
    const rng = mulberry32(hashString(`top:${artisanId}`));
    const now = new Date(PIVOT);
    const list = publishedPassports(artisanId).map((passport) => {
        const score = computeScore(passport, { artisan, certificates: mockCertificates, now });
        const baseScans = 80 + Math.floor(rng() * 200);
        const weighted = baseScans * GRADE_WEIGHT[score.grade];
        const scans = Math.round(weighted);
        const conversions = Math.max(0, Math.round(scans * (0.04 + rng() * 0.08)));
        return { passport, grade: score.grade, scans, conversions };
    });
    return list.sort((a, b) => b.scans - a.scans).slice(0, limit);
}

interface PerformancePoint {
    label: string;
    score: number;
}

interface PerformanceSummary {
    currentAvg: number;
    series: PerformancePoint[];
}

const MONTH_LABELS_FR = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];

export function getPerformance(artisanId: string): PerformanceSummary {
    const artisan = mockArtisanById(artisanId);
    if (!artisan) return { currentAvg: 0, series: [] };
    const now = new Date(PIVOT);
    const published = publishedPassports(artisanId);
    const currentAvg =
        published.length === 0
            ? 0
            : Math.round(
                  (published.reduce(
                      (acc, p) => acc + computeScore(p, { artisan, certificates: mockCertificates, now }).total,
                      0,
                  ) /
                      published.length) *
                      10,
              ) / 10;

    const rng = mulberry32(hashString(`perf:${artisanId}`));
    const series: PerformancePoint[] = [];
    for (let i = 5; i >= 0; i--) {
        const monthIdx = (new Date(PIVOT).getUTCMonth() - i + 12) % 12;
        const drift = (5 - i) * (0.4 + rng() * 0.4);
        const noise = (rng() - 0.5) * 2;
        const score = Math.max(0, Math.min(100, Math.round((currentAvg - drift + noise) * 10) / 10));
        series.push({ label: MONTH_LABELS_FR[monthIdx] ?? '?', score });
    }
    if (series.length > 0) {
        series[series.length - 1] = { label: series[series.length - 1]?.label ?? '?', score: currentAvg };
    }
    return { currentAvg, series };
}

interface MarketBenchmark {
    avgScore: number;
    topScore: number;
}

export function getMarketBenchmark(): MarketBenchmark {
    return { avgScore: 62, topScore: 84 };
}
