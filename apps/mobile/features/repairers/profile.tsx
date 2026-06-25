'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, CalendarCheck, Clock, Mail, MapPin, Phone, Star, Wrench } from 'lucide-react';
import { Badge } from '@lumiris/ui/components/badge';
import type { Repairer, RepairerSpecialty } from '@lumiris/types';
import { isLumirisLocal, repairerSlug } from '@/lib/repairers/badge';
import { RepairersMap } from './repairers-map';
import { BookingSheet } from './booking-sheet';

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

interface RepairerProfileProps {
    repairer: Repairer;
}

export function RepairerProfile({ repairer }: RepairerProfileProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const forParam = searchParams.get('for');
    const isLocal = isLumirisLocal(repairer);
    const slug = repairerSlug(repairer);
    const [bookingOpen, setBookingOpen] = useState(false);

    const requestHref = useMemo(() => {
        const base = `/retoucheurs/${slug}/request`;
        return forParam ? `${base}?for=${encodeURIComponent(forParam)}` : base;
    }, [slug, forParam]);

    return (
        <div className="bg-background flex h-full flex-col overflow-y-auto pb-24">
            <motion.header
                className="flex items-center gap-3 px-4 pb-3 pt-12"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button
                    type="button"
                    onClick={() => router.push(forParam ? `/local?for=${encodeURIComponent(forParam)}` : '/local')}
                    aria-label="Retour"
                    className="border-border bg-card text-foreground inline-flex h-9 w-9 items-center justify-center rounded-full border"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="text-foreground truncate text-base font-bold">{repairer.displayName}</h1>
                    <p className="text-muted-foreground truncate text-xs">
                        {repairer.atelierName ?? '-'} · {repairer.city}
                    </p>
                </div>
            </motion.header>

            <div className="flex flex-col gap-5 px-4">
                <section className="border-border/60 bg-card flex flex-col gap-3 rounded-3xl border p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-foreground truncate text-base font-semibold">
                                {repairer.atelierName ?? repairer.displayName}
                            </p>
                            <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                                <MapPin className="h-3 w-3" />
                                {repairer.city} · {repairer.region}
                            </p>
                        </div>
                        {isLocal ? (
                            <span className="border-lumiris-amber/40 bg-lumiris-amber/10 text-lumiris-amber inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold">
                                <Award className="h-3 w-3" />
                                LUMIRIS Local
                            </span>
                        ) : null}
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1">
                            <Star className="text-lumiris-amber h-3.5 w-3.5 fill-current" />
                            <span className="text-foreground font-semibold">{repairer.avgRating.toFixed(1)}</span>
                            <span className="text-muted-foreground">({repairer.reviewCount})</span>
                        </span>
                        <span className="text-muted-foreground inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> ~{repairer.avgDelayDays} j
                        </span>
                        <span className="text-foreground font-mono">
                            {repairer.priceRange.min}–{repairer.priceRange.max} €
                        </span>
                    </div>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                        Services
                    </h2>
                    <ul className="flex flex-wrap gap-1.5">
                        {repairer.specialities.map((s) => (
                            <li key={s}>
                                <Badge variant="secondary" className="text-[11px]">
                                    {SPECIALITY_LABEL[s]}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                    <p className="text-muted-foreground/80 text-[11px]">
                        Tarifs indicatifs entre {repairer.priceRange.min} € et {repairer.priceRange.max} €.
                    </p>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                        Localisation
                    </h2>
                    <RepairersMap repairers={[repairer]} />
                </section>

                <section className="flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={() => setBookingOpen(true)}
                        className="bg-foreground text-background inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold active:scale-95"
                    >
                        <CalendarCheck className="h-4 w-4" />
                        Prendre rendez-vous
                    </button>
                    <Link
                        href={requestHref}
                        className="border-border bg-card text-foreground inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-xs font-medium active:scale-95"
                    >
                        <Wrench className="h-3.5 w-3.5" />
                        Demande détaillée avec photos
                    </Link>

                    {repairer.phone || repairer.email ? (
                        <div
                            className={`grid gap-2 ${repairer.phone && repairer.email ? 'grid-cols-2' : 'grid-cols-1'}`}
                        >
                            {repairer.phone ? (
                                <a
                                    href={`tel:${repairer.phone}`}
                                    className="border-border bg-card text-foreground inline-flex items-center justify-center gap-2 rounded-full border py-2.5 text-xs font-medium"
                                >
                                    <Phone className="h-3.5 w-3.5" /> Appeler
                                </a>
                            ) : null}
                            {repairer.email ? (
                                <a
                                    href={`mailto:${repairer.email}`}
                                    className="border-border bg-card text-foreground inline-flex items-center justify-center gap-2 rounded-full border py-2.5 text-xs font-medium"
                                >
                                    <Mail className="h-3.5 w-3.5" /> Email
                                </a>
                            ) : null}
                        </div>
                    ) : null}

                    <p className="text-muted-foreground/80 mt-1 text-center text-[10px]">
                        Affiliation LUMIRIS - commission 4-10 € ou 8 % du devis si la demande aboutit.
                    </p>
                </section>
            </div>

            <BookingSheet repairer={repairer} open={bookingOpen} onOpenChange={setBookingOpen} />
        </div>
    );
}
