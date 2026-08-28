import { z } from 'zod';

export const wardrobeItemKindSchema = z.enum(['lumiris-passport', 'external-dpp', 'public-dpp', 'manual']);
export type WardrobeItemKind = z.infer<typeof wardrobeItemKindSchema>;

export const wardrobeSyncUpsertSchema = z.object({
    clientKey: z.string().min(1).max(255),
    kind: wardrobeItemKindSchema,
    addedAt: z.string(),
    payload: z.record(z.unknown()),
});
export type WardrobeSyncUpsert = z.infer<typeof wardrobeSyncUpsertSchema>;

export interface WardrobeSyncRequest {
    upserts: WardrobeSyncUpsert[];
    deletedKeys: string[];
}

// Une pièce de la Garde-Robe de l'acheteur (achetée en direct) : passeport + facture + garantie,
// et de quoi lui parler APRÈS la livraison — la période la plus longue de la relation.
// `warrantyUntil` est figée à l'achat ; nulle quand l'atelier n'a déclaré aucune durée, auquel cas
// aucune échéance n'est affichée (on n'invente pas une date sur un droit contractuel).
export const wardrobeItemDtoSchema = z.object({
    id: z.string(),
    dppFormId: z.string().nullish(),
    dppPublicCode: z.string().nullish(),
    productName: z.string().nullish(),
    variantLabel: z.string().nullish(),
    warrantyDescription: z.string().nullish(),
    warrantyUntil: z.string().nullish(),
    // Codes de symboles d'entretien du passeport (`wash-30`, `dry-clean`, …).
    careInstructions: z.array(z.string()).nullish(),
    careNotes: z.string().nullish(),
    invoiceNumber: z.string().nullish(),
    acquiredAt: z.string().nullish(),
    origin: z.enum(['purchase', 'user']),
    clientKey: z.string().nullish(),
    kind: wardrobeItemKindSchema.nullish(),
    payload: z.record(z.unknown()).nullish(),
});
export type WardrobeItemDto = z.infer<typeof wardrobeItemDtoSchema>;
