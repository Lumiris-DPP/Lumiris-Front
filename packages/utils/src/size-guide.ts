export interface SizeMeasurementRow {
    sizeLabel: string;
    label: string;
    valueMm: number;
    position?: number | null;
}

export interface SizeGuideRow {
    sizeLabel: string;
    values: Array<number | null>;
}

export interface SizeGuideGrid {
    labels: string[];
    rows: SizeGuideRow[];
}

/**
 * Transforme les mesures à plat de l'atelier en grille tailles × cotes, prête à rendre en tableau.
 * Une case absente reste `null` : un atelier ne relève pas forcément toutes les cotes sur toutes
 * les tailles, et inventer une valeur serait pire que ne rien afficher.
 */
export function pivotSizeGuide(measurements: readonly SizeMeasurementRow[]): SizeGuideGrid {
    const labels: string[] = [];
    const sizes: string[] = [];
    const byKey = new Map<string, number>();

    const ordered = [...measurements].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    for (const measurement of ordered) {
        if (!labels.includes(measurement.label)) labels.push(measurement.label);
        if (!sizes.includes(measurement.sizeLabel)) sizes.push(measurement.sizeLabel);
        byKey.set(`${measurement.sizeLabel}\0${measurement.label}`, measurement.valueMm);
    }

    return {
        labels,
        rows: sizes.map((sizeLabel) => ({
            sizeLabel,
            values: labels.map((label) => byKey.get(`${sizeLabel}\0${label}`) ?? null),
        })),
    };
}

/** Millimètres entiers → centimètres lisibles (« 96 cm », « 68,5 cm »). */
export function formatMillimeters(mm: number): string {
    const cm = mm / 10;
    return `${Number.isInteger(cm) ? cm : cm.toFixed(1).replace('.', ',')} cm`;
}
