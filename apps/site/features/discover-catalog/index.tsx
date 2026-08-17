'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@lumiris/ui/components/tabs';
import { mockPassportsPublic } from '@lumiris/mock-data';
import { IrisGrade } from '@lumiris/scoring-ui/components/iris-grade';
import type { IrisGrade as IrisGradeType } from '@lumiris/types';
import { ArtisansDirectory } from '@/features/artisans-directory';
import type { ArtisanPublicProfileDto } from '@/lib/public-artisan-api';

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

interface Props {
    artisans: readonly ArtisanPublicProfileDto[];
}

export function DiscoverCatalog({ artisans }: Props) {
    const [activeTab, setActiveTab] = useState<'pieces' | 'ateliers'>('pieces');

    // Pieces filters
    const [selectedGrades, setSelectedGrades] = useState<IrisGradeType[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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

    const hasPiecesFilters = selectedGrades.length > 0 || selectedCategories.length > 0;

    const resetPiecesFilters = () => {
        setSelectedGrades([]);
        setSelectedCategories([]);
    };

    const toggleGrade = (grade: IrisGradeType) => {
        setSelectedGrades((prev) => (prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]));
    };

    const toggleCategory = (cat: string) => {
        setSelectedCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
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
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Découvrir</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Explorez les pièces tracées et les ateliers artisans partenaires.
                </p>
            </motion.div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pieces' | 'ateliers')} className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="pieces" className="px-4">
                        Pièces ({mockPassportsPublic.length})
                    </TabsTrigger>
                    <TabsTrigger value="ateliers" className="px-4">
                        Ateliers ({artisans.length})
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
                            <span className="text-sm text-muted-foreground">Catégorie :</span>
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
                                <strong className="text-foreground">{filteredPieces.length}</strong> pièce
                                {filteredPieces.length !== 1 ? 's' : ''}
                            </p>
                            {hasPiecesFilters && (
                                <button
                                    onClick={resetPiecesFilters}
                                    className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Réinitialiser
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
                                    <div className="group relative overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg">
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
                                            <span className="mt-2 inline-flex items-center gap-1 text-xs text-lumiris-cyan">
                                                Voir le passeport
                                                <ArrowRight className="h-3 w-3" aria-hidden />
                                            </span>
                                        </div>
                                        <Link
                                            href={`/passeport/${item.passport.id}`}
                                            aria-label={`Passeport ${item.passport.garment.reference}`}
                                            className="absolute inset-0"
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-16 text-center">
                            <p className="text-muted-foreground">
                                Aucune pièce ne correspond aux filtres sélectionnés.
                            </p>
                            <button
                                onClick={resetPiecesFilters}
                                className="mt-3 text-sm font-medium text-lumiris-cyan transition-colors hover:text-lumiris-cyan/80"
                            >
                                Réinitialiser les filtres
                            </button>
                        </div>
                    )}
                </TabsContent>

                {/* Ateliers Tab */}
                <TabsContent value="ateliers">
                    <ArtisansDirectory artisans={artisans} />
                </TabsContent>
            </Tabs>

            {/* Cross-link between tabs */}
            <div className="mt-12 text-center">
                {activeTab === 'pieces' ? (
                    <button
                        onClick={() => setActiveTab('ateliers')}
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Découvrir les ateliers partenaires
                        <ArrowRight className="h-4 w-4" />
                    </button>
                ) : (
                    <button
                        onClick={() => setActiveTab('pieces')}
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Voir les pièces tracées
                        <ArrowRight className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
