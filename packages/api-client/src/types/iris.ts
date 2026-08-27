import { z } from 'zod';

export const irisMethodologySectionSchema = z.object({
    key: z.string(),
    label: z.string(),
    /** Absent pour les sections hors moyenne pondérée (plafond réglementaire). */
    weightPercent: z.number().nullish(),
    what: z.string(),
    howToImprove: z.array(z.string()),
});
export type IrisMethodologySection = z.infer<typeof irisMethodologySectionSchema>;

export const irisGradeScaleSchema = z.object({
    grade: z.string(),
    minScore: z.number(),
    label: z.string(),
});
export type IrisGradeScale = z.infer<typeof irisGradeScaleSchema>;

export const irisMethodologySchema = z.object({
    version: z.string(),
    title: z.string(),
    intro: z.string(),
    /** Ordre d'affichage imposé par le backend : ne pas retrier côté front. */
    sections: z.array(irisMethodologySectionSchema),
    grades: z.array(irisGradeScaleSchema),
    disclaimer: z.string().nullish(),
});
export type IrisMethodology = z.infer<typeof irisMethodologySchema>;
