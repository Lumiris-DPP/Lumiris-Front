'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { X, MapPin, ArrowRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@lumiris/ui/components/tabs';
import { mockPassportsPublic, passportPublicByArtisan } from '@lumiris/mock-data';
import { mockArtisansWithSlug } from '@lumiris/mock-data';
import { IrisGrade } from '@lumiris/scoring-ui/components/iris-grade';
import type { IrisGrade as IrisGradeType } from '@lumiris/types';

// Categories for pieces
const CATEGORIES = [
    { key: 'sweater', label: 'Pull' },
    { key: 'shirt', label: 'Chemise' },
    { key: 'shoe', label: 'Chaussure' },
    { key: 'jacket', label: 'Veste' },
    { key: 'trouser', label: 'Pantalon' },
    { key: 'accessory', label: 'Accessoire' },
] as const;

// Grade filters
const GRADES: IrisGradeType[] = ['A', 'B', 'C', 'D', 'E'];

// Unique regions from artisans
const REGIONS = Array.from(new Set(mockArtisansWithSlug.map((a) => a.region))).sort();

// Certification options
const CERTIFICATIONS = [
    { key: 'epv', label: 'EPV' },
    { key: 'ofg', label: 'OFG' },
    { key: 'none', label: 'Aucune' },
] as const;

// Specialities from artisans
const SPECIALITIES = Array.from(new Set(mockArtisansWithSlug.flatMap((a) => a.specialities))).sort();

export function DiscoverCatalog() {
    const [activeTab, setActiveTab] = useState<'pieces' | 'ateliers'>('pieces');

    // Pieces filters
    const [selectedGrades, setSelectedGrades] = useState<IrisGradeType[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // Ateliers filters
    const [selectedRegion, setSelectedRegion] = useState<string>('');
    const [selectedCertification, setSelectedCertification] = useState<string>('');
    const [selectedSpecialities, setSelectedSpecialities] = useState<string[]>([]);

    // Filtered pieces
    const filteredPieces = useMemo(() => {
        return mockPassportsPublic.filter((item) => {
            // Grade filter
            if (selectedGrades.length > 0) {
                const grade = item.irisScore?.grade ?? 'C';
                if (!selectedGrades.includes(grade)) return false;
            }
            // Category filter
            if (selectedCategories.length > 0) {
                if (!selectedCategories.includes(item.passport.garment.kind)) return false;
            }
            return true;
        });
    }, [selectedGrades, selectedCategories]);

    // Filtered ateliers
    const filteredAteliers = useMemo(() => {
        return mockArtisansWithSlug.filter((artisan) => {
            if (selectedRegion && artisan.region !== selectedRegion) return false;
            if (selectedCertification) {
                if (selectedCertification === 'epv' && !artisan.epvLabeled) return false;
                if (selectedCertification === 'ofg' && !artisan.ofgLabeled) return false;
                if (selectedCertification === 'none' && (artisan.epvLabeled || artisan.ofgLabeled)) return false;
            }
            if (selectedSpecialities.length > 0) {
                const hasSpec = selectedSpecialities.some((s) => artisan.specialities.includes(s));
                if (!hasSpec) return false;
            }
            return true;
        });
    }, [selectedRegion, selectedCertification, selectedSpecialities]);

    // Group ateliers by region
    const ateliersByRegion = useMemo(() => {
        const grouped: Record<string, Array<(typeof filteredAteliers)[number]>> = {};
        for (const artisan of filteredAteliers) {
            const list = grouped[artisan.region] ?? [];
            list.push(artisan);
            grouped[artisan.region] = list;
        }
        return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
    }, [filteredAteliers]);

    const hasPiecesFilters = selectedGrades.length > 0 || selectedCategories.length > 0;
    const hasAteliersFilters = selectedRegion || selectedCertification || selectedSpecialities.length > 0;

    const resetPiecesFilters = () => {
        setSelectedGrades([]);
        setSelectedCategories([]);
    };

    const resetAteliersFilters = () => {
        setSelectedRegion('');
        setSelectedCertification('');
        setSelectedSpecialities([]);
    };

    const toggleGrade = (grade: IrisGradeType) => {
        setSelectedGrades((prev) => (prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]));
    };

    const toggleCategory = (cat: string) => {
        setSelectedCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
    };

    const toggleSpeciality = (spec: string) => {
        setSelectedSpecialities((prev) => (prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]));
    };

    return (
        <div className="mx-auto max-w-6xl px-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Decouvrir</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Explorez les pieces tracees et les ateliers artisans partenaires.
                </p>
            </motion.div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pieces' | 'ateliers')} className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="pieces" className="px-4">
                        Pieces ({mockPassportsPublic.length})
                    </TabsTrigger>
                    <TabsTrigger value="ateliers" className="px-4">
                        Ateliers ({mockArtisansWithSlug.length})
                    </TabsTrigger>
                </TabsList>

                {/* Pieces Tab */}
                <TabsContent value="pieces">
                    {/* Filters */}
                    <div className="mb-6 space-y-4">
                        {/* Grade pills */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground">Score :</span>
                            {GRADES.map((grade) => (
                                <button
                                    key={grade}
                                    onClick={() => toggleGrade(grade)}
                                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                                        selectedGrades.includes(grade)
                                            ? 'bg-foreground text-background'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                                >
                                    {grade}
                                </button>
                            ))}
                        </div>

                        {/* Category chips */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground">Categorie :</span>
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.key}
                                    onClick={() => toggleCategory(cat.key)}
                                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                                        selectedCategories.includes(cat.key)
                                            ? 'bg-foreground text-background'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Reset + count */}
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                <strong className="text-foreground">{filteredPieces.length}</strong> piece
                                {filteredPieces.length !== 1 ? 's' : ''}
                            </p>
                            {hasPiecesFilters && (
                                <button
                                    onClick={resetPiecesFilters}
                                    className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Reinitialiser
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Grid */}
                    {filteredPieces.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {filteredPieces.map((item, index) => (
                                <motion.div
                                    key={item.passport.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.02 }}
                                >
                                    <Link href={`/passeport/${item.passport.id}`} className="group block">
                                        <div className="overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg">
                                            <div className="relative aspect-[4/5]">
                                                <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-lumiris-cyan/10 to-lumiris-iris/10" />
                                                <div className="absolute top-2.5 left-2.5">
                                                    <IrisGrade grade={item.irisScore?.grade ?? 'B'} size="sm" />
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                    {item.artisan.atelierName}
                                                </p>
                                                <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                                                    {item.passport.garment.reference}
                                                </p>
                                                <Link
                                                    href={`/artisans/${item.artisan.id}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="mt-2 inline-flex items-center gap-1 text-xs text-lumiris-cyan transition-colors hover:text-lumiris-cyan/80"
                                                >
                                                    Voir l&apos;atelier
                                                    <ArrowRight className="h-3 w-3" />
                                                </Link>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-16 text-center">
                            <p className="text-muted-foreground">
                                Aucune piece ne correspond aux filtres selectionnes.
                            </p>
                            <button
                                onClick={resetPiecesFilters}
                                className="mt-3 text-sm font-medium text-lumiris-cyan transition-colors hover:text-lumiris-cyan/80"
                            >
                                Reinitialiser les filtres
                            </button>
                        </div>
                    )}
                </TabsContent>

                {/* Ateliers Tab */}
                <TabsContent value="ateliers">
                    {/* Filters */}
                    <div className="mb-6 space-y-4">
                        {/* Region + certification selects */}
                        <div className="flex flex-wrap gap-3">
                            <select
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(e.target.value)}
                                className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground"
                            >
                                <option value="">Toutes les regions</option>
                                {REGIONS.map((region) => (
                                    <option key={region} value={region}>
                                        {region}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={selectedCertification}
                                onChange={(e) => setSelectedCertification(e.target.value)}
                                className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground"
                            >
                                <option value="">Toutes certifications</option>
                                {CERTIFICATIONS.map((cert) => (
                                    <option key={cert.key} value={cert.key}>
                                        {cert.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Speciality chips */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground">Specialites :</span>
                            {SPECIALITIES.slice(0, 8).map((spec) => (
                                <button
                                    key={spec}
                                    onClick={() => toggleSpeciality(spec)}
                                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                                        selectedSpecialities.includes(spec)
                                            ? 'bg-foreground text-background'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                                >
                                    {spec}
                                </button>
                            ))}
                        </div>

                        {/* Reset + count */}
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                <strong className="text-foreground">{filteredAteliers.length}</strong> atelier
                                {filteredAteliers.length !== 1 ? 's' : ''}
                            </p>
                            {hasAteliersFilters && (
                                <button
                                    onClick={resetAteliersFilters}
                                    className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Reinitialiser
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Grouped by region */}
                    {filteredAteliers.length > 0 ? (
                        <div className="space-y-10">
                            {ateliersByRegion.map(([region, artisans]) => (
                                <div key={region}>
                                    <h3 className="mb-4 text-lg font-semibold text-foreground">
                                        {region}{' '}
                                        <span className="font-normal text-muted-foreground">({artisans.length})</span>
                                    </h3>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {artisans.map((artisan, index) => {
                                            const artisanPieces = passportPublicByArtisan(artisan.id);
                                            return (
                                                <motion.div
                                                    key={artisan.id}
                                                    initial={{ opacity: 0, y: 16 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.03 }}
                                                >
                                                    <Link href={`/artisans/${artisan.slug}`} className="group block">
                                                        <div className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-lg">
                                                            <div className="flex gap-4">
                                                                <div className="h-16 w-16 shrink-0 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300" />
                                                                <div className="flex-1">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div>
                                                                            <p className="font-semibold text-foreground">
                                                                                {artisan.atelierName}
                                                                            </p>
                                                                            <p className="flex items-center gap-1 text-sm text-muted-foreground">
                                                                                <MapPin className="h-3 w-3" />
                                                                                {artisan.city}
                                                                            </p>
                                                                        </div>
                                                                        {(artisan.epvLabeled || artisan.ofgLabeled) && (
                                                                            <div className="flex gap-1">
                                                                                {artisan.epvLabeled && (
                                                                                    <span className="rounded bg-lumiris-amber/10 px-1.5 py-0.5 text-[10px] font-bold text-lumiris-amber">
                                                                                        EPV
                                                                                    </span>
                                                                                )}
                                                                                {artisan.ofgLabeled && (
                                                                                    <span className="rounded bg-lumiris-cyan/10 px-1.5 py-0.5 text-[10px] font-bold text-lumiris-cyan">
                                                                                        OFG
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <p className="mt-2 text-xs text-muted-foreground">
                                                                        {artisanPieces.length} piece
                                                                        {artisanPieces.length !== 1 ? 's' : ''} tracee
                                                                        {artisanPieces.length !== 1 ? 's' : ''}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-16 text-center">
                            <p className="text-muted-foreground">
                                Aucun atelier ne correspond aux filtres selectionnes.
                            </p>
                            <button
                                onClick={resetAteliersFilters}
                                className="mt-3 text-sm font-medium text-lumiris-cyan transition-colors hover:text-lumiris-cyan/80"
                            >
                                Reinitialiser les filtres
                            </button>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Cross-link between tabs */}
            <div className="mt-12 text-center">
                {activeTab === 'pieces' ? (
                    <button
                        onClick={() => setActiveTab('ateliers')}
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Decouvrir les ateliers partenaires
                        <ArrowRight className="h-4 w-4" />
                    </button>
                ) : (
                    <button
                        onClick={() => setActiveTab('pieces')}
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Voir les pieces tracees
                        <ArrowRight className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
