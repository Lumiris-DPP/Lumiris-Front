/**
 * Horloge de référence des fixtures `@lumiris/mock-data`, sur lesquelles tourne la console.
 * Tout ce qui se dérive d'un horodatage de fixture (âge d'une file, fenêtre glissante, score)
 * se calcule contre elle : mesurer un âge de fixture avec `Date.now()` fait cohabiter un
 * « Reçu il y a 220 j » avec un badge « SLA 48 h » qui n'a jamais été dépassé.
 */
export const FIXTURE_NOW = new Date('2026-04-30T08:00:00Z');

export const FIXTURE_NOW_MS = FIXTURE_NOW.getTime();
