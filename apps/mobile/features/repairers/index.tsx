'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, Clock, MapPin, Search, Star } from 'lucide-react';
import { Badge } from '@lumiris/ui/components/badge';
import { mockRepairers, CITY_COORDS, distanceKm } from '@lumiris/mock-data';
import type { Coordinates, Repairer, RepairerSector, RepairerSpecialty } from '@lumiris/types';
import { SPECIALTY_TO_SECTOR } from '@lumiris/types';
import { isLumirisLocal, repairerSlug } from '@/lib/repairers/badge';
import { RepairersMap } from './repairers-map';

const SPECIALITY_LABEL: Record<RepairerSpecialty, string> = {
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

const SECTOR_LABEL: Record<RepairerSector, string> = {
    textile: 'Textile',
    electronics: 'Électronique',
    furniture: 'Mobilier',
    appliance: 'Électroménager',
};

const SECTOR_ORDER: readonly RepairerSector[] = ['textile', 'electronics', 'furniture', 'appliance'];

const SPECIALITIES_BY_SECTOR: Record<RepairerSector, readonly RepairerSpecialty[]> = {
    textile: ['alteration', 'embroidery', 'shoe-repair', 'leather', 'lining'],
    electronics: ['electronics-repair', 'phone-repair', 'computer-repair'],
    furniture: ['cabinetmaking', 'upholstery'],
    appliance: ['appliance-repair'],
};

export function RepairersDirectory() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const forParam = searchParams.get('for');
    const forQuery = forParam ? `?for=${encodeURIComponent(forParam)}` : '';

    const availableSectors = useMemo(() => {
        const set = new Set<RepairerSector>();
        for (const r of mockRepairers) {
            for (const s of r.specialities) set.add(SPECIALTY_TO_SECTOR[s]);
        }
        return SECTOR_ORDER.filter((sector) => set.has(sector));
    }, []);
    const showSectorFilter = availableSectors.length > 1;

    const [city, setCity] = useState('');
    const [activeSector, setActiveSector] = useState<RepairerSector | null>(null);
    const [activeSpecs, setActiveSpecs] = useState<Set<RepairerSpecialty>>(new Set());
    const [maxPrice, setMaxPrice] = useState<number>(200);
    const [maxDelay, setMaxDelay] = useState<number>(14);
    const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const cardRefs = useRef<Map<string, HTMLLIElement>>(new Map());

    const visibleSpecialities = useMemo<readonly RepairerSpecialty[]>(() => {
        if (activeSector === null) {
            return availableSectors.flatMap((s) => SPECIALITIES_BY_SECTOR[s]);
        }
        return SPECIALITIES_BY_SECTOR[activeSector];
    }, [activeSector, availableSectors]);

    const selectSector = (sector: RepairerSector | null) => {
        setActiveSector(sector);
        setActiveSpecs((prev) => {
            if (sector === null) return prev;
            const allowed = new Set<RepairerSpecialty>(SPECIALITIES_BY_SECTOR[sector]);
            const next = new Set<RepairerSpecialty>();
            for (const s of prev) if (allowed.has(s)) next.add(s);
            return next;
        });
    };

    useEffect(() => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => {},
            { timeout: 5000, maximumAge: 60_000 },
        );
    }, []);

    const toggleSpec = (spec: RepairerSpecialty) => {
        setActiveSpecs((prev) => {
            const next = new Set(prev);
            if (next.has(spec)) next.delete(spec);
            else next.add(spec);
            return next;
        });
    };

    const items = useMemo(() => {
        const filtered = mockRepairers.filter((r) => {
            if (city && !r.city.toLowerCase().includes(city.toLowerCase())) return false;
            if (activeSector !== null && !r.specialities.some((s) => SPECIALTY_TO_SECTOR[s] === activeSector))
                return false;
            if (activeSpecs.size > 0 && !r.specialities.some((s) => activeSpecs.has(s))) return false;
            if (r.priceRange.min > maxPrice) return false;
            if (r.avgDelayDays > maxDelay) return false;
            return true;
        });

        if (userCoords) {
            return [...filtered]
                .map((r) => {
                    const cityCoords = CITY_COORDS[r.city];
                    const distance = cityCoords ? distanceKm(userCoords, cityCoords) : undefined;
                    return { repairer: r, distance };
                })
                .sort((a, b) => (a.distance ?? Number.POSITIVE_INFINITY) - (b.distance ?? Number.POSITIVE_INFINITY));
        }
        return [...filtered]
            .map((r) => ({ repairer: r, distance: undefined as number | undefined }))
            .sort((a, b) => b.repairer.avgRating - a.repairer.avgRating);
    }, [city, activeSector, activeSpecs, maxPrice, maxDelay, userCoords]);

    const filteredRepairers = useMemo(() => items.map((it) => it.repairer), [items]);

    const onMarkerClick = (repairerId: string) => {
        setHighlightedId(repairerId);
        const node = cardRefs.current.get(repairerId);
        if (node) {
            node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const onCardTap = (repairer: Repairer) => {
        router.push(`/retoucheurs/${repairerSlug(repairer)}${forQuery}`);
    };

    return (
        <div className="bg-background flex h-full flex-col">
            <motion.header
                className="flex items-center gap-3 px-4 pb-3 pt-12"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button
                    type="button"
                    onClick={() => router.back()}
                    aria-label="Retour"
                    className="border-border bg-card text-foreground inline-flex h-9 w-9 items-center justify-center rounded-full border"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="text-foreground text-base font-bold">Retoucheurs & réparateurs</h1>
                    <p className="text-muted-foreground text-xs">
                        {items.length} atelier{items.length > 1 ? 's' : ''}
                        {userCoords ? ' · trié par distance' : ' · trié par note'}
                    </p>
                </div>
            </motion.header>

            <div className="flex flex-col gap-3 px-4 pb-3">
                <label className="border-border bg-card text-foreground flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm">
                    <Search className="text-muted-foreground h-4 w-4" />
                    <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ville (Lyon, Paris…)"
                        className="placeholder:text-muted-foreground/60 flex-1 bg-transparent outline-none"
                        aria-label="Filtre ville"
                    />
                </label>

                {showSectorFilter ? (
                    <ul className="-mx-1 flex flex-wrap gap-1.5 px-1" aria-label="Filtre secteur">
                        <li>
                            <button
                                type="button"
                                onClick={() => selectSector(null)}
                                aria-pressed={activeSector === null}
                                className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                                    activeSector === null
                                        ? 'border-lumiris-cyan bg-lumiris-cyan/10 text-lumiris-cyan'
                                        : 'border-border bg-card text-muted-foreground'
                                }`}
                            >
                                Tous secteurs
                            </button>
                        </li>
                        {availableSectors.map((sector) => {
                            const active = activeSector === sector;
                            return (
                                <li key={sector}>
                                    <button
                                        type="button"
                                        onClick={() => selectSector(sector)}
                                        aria-pressed={active}
                                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                                            active
                                                ? 'border-lumiris-cyan bg-lumiris-cyan/10 text-lumiris-cyan'
                                                : 'border-border bg-card text-muted-foreground'
                                        }`}
                                    >
                                        {SECTOR_LABEL[sector]}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                ) : null}

                <ul className="-mx-1 flex flex-wrap gap-1.5 px-1" aria-label="Filtre spécialité">
                    {visibleSpecialities.map((spec) => {
                        const active = activeSpecs.has(spec);
                        return (
                            <li key={spec}>
                                <button
                                    type="button"
                                    onClick={() => toggleSpec(spec)}
                                    aria-pressed={active}
                                    className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${
                                        active
                                            ? 'border-lumiris-cyan bg-lumiris-cyan/10 text-lumiris-cyan'
                                            : 'border-border bg-card text-muted-foreground'
                                    }`}
                                >
                                    {SPECIALITY_LABEL[spec]}
                                </button>
                            </li>
                        );
                    })}
                </ul>

                <div className="grid grid-cols-2 gap-3">
                    <RangeInput
                        label="Prix max"
                        suffix="€"
                        value={maxPrice}
                        min={20}
                        max={300}
                        step={10}
                        onChange={setMaxPrice}
                    />
                    <RangeInput
                        label="Délai max"
                        suffix="j"
                        value={maxDelay}
                        min={1}
                        max={21}
                        step={1}
                        onChange={setMaxDelay}
                    />
                </div>

                <RepairersMap repairers={filteredRepairers} activeId={highlightedId} onMarkerClick={onMarkerClick} />
            </div>

            <ul className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-24">
                {items.length === 0 ? (
                    <li className="text-muted-foreground py-10 text-center text-sm italic">
                        Aucun retoucheur ne correspond à ces filtres.
                    </li>
                ) : (
                    items.map(({ repairer, distance }) => {
                        const highlighted = highlightedId === repairer.id;
                        const isLocal = isLumirisLocal(repairer);
                        return (
                            <li
                                key={repairer.id}
                                ref={(node) => {
                                    if (node) cardRefs.current.set(repairer.id, node);
                                    else cardRefs.current.delete(repairer.id);
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => onCardTap(repairer)}
                                    className={`flex w-full flex-col gap-2 rounded-2xl border p-4 text-left transition-colors ${
                                        highlighted
                                            ? 'border-lumiris-cyan bg-lumiris-cyan/5 ring-lumiris-cyan/20 ring-2'
                                            : 'border-border/60 bg-card'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-foreground inline-flex items-center gap-1.5 truncate text-sm font-semibold">
                                                {repairer.displayName}
                                                {isLocal ? (
                                                    <span
                                                        className="text-lumiris-amber inline-flex items-center"
                                                        aria-label="LUMIRIS Local"
                                                        title="LUMIRIS Local"
                                                    >
                                                        <Award className="h-3.5 w-3.5" />
                                                    </span>
                                                ) : null}
                                            </p>
                                            <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                                                <MapPin className="h-3 w-3" />
                                                {repairer.city}
                                                {typeof distance === 'number' ? (
                                                    <span className="text-muted-foreground/70 font-mono">
                                                        · {distance.toFixed(0)} km
                                                    </span>
                                                ) : null}
                                            </p>
                                        </div>
                                        <div className="text-foreground inline-flex items-center gap-1 text-sm font-semibold">
                                            <Star className="text-lumiris-amber h-3.5 w-3.5 fill-current" />
                                            {repairer.avgRating.toFixed(1)}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {repairer.specialities.map((s) => (
                                            <Badge key={s} variant="secondary" className="text-[10px]">
                                                {SPECIALITY_LABEL[s]}
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="text-muted-foreground flex items-center justify-between text-xs">
                                        <span className="inline-flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> ~{repairer.avgDelayDays} j
                                        </span>
                                        <span className="font-mono">
                                            {repairer.priceRange.min}–{repairer.priceRange.max} €
                                        </span>
                                    </div>
                                </button>
                            </li>
                        );
                    })
                )}
            </ul>
        </div>
    );
}

function RangeInput({
    label,
    suffix,
    value,
    min,
    max,
    step,
    onChange,
}: {
    label: string;
    suffix: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (n: number) => void;
}) {
    const inputId = useId();
    return (
        <label htmlFor={inputId} className="border-border bg-card flex flex-col gap-1 rounded-2xl border px-3 py-2">
            <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                {label}
                <span className="text-foreground ml-1">
                    {value}
                    {suffix}
                </span>
            </span>
            <input
                id={inputId}
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="accent-lumiris-cyan"
                aria-label={`${label} (${value}${suffix})`}
            />
        </label>
    );
}
