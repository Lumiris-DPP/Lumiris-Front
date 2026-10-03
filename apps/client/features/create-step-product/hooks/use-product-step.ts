'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GarmentInfo } from '@lumiris/types';
import { useStepNavigation } from '@/features/wizard-shell/use-step-navigation';
import { useDraftStore } from '@/lib/draft-store';
import { draftToValidationInput } from '@/features/wizard-shell/validation-input';
import { validateStep } from '../schema';

import { nonNegativeInteger } from '../../marketplace-products/models/product-input';

/** Pilote les informations et documents de la pièce avant leur sauvegarde. */
export function useProductStep(draftId: string) {
    const draft = useDraftStore((s) => s.drafts[draftId]);
    const setGarment = useDraftStore((s) => s.setGarment);
    const setFile = useDraftStore((s) => s.setFile);
    const { goNext } = useStepNavigation(draftId);

    const [form, setForm] = useState<GarmentInfo>(
        draft?.garment ?? {
            kind: 'sweater',
            name: '',
            reference: '',
            mainPhotoUrl: '',
            dimensions: {},
            retailPrice: 0,
            currency: 'EUR',
        },
    );

    const [photoFile, setPhotoFile] = useState<File | null>(() => draft?.files?.['PRODUCT_PHOTO'] ?? null);
    const [saleInvoiceFile, setSaleInvoiceFile] = useState<File | null>(() => draft?.files?.['SALE_INVOICE'] ?? null);
    const [creationPassportFile, setCreationPassportFile] = useState<File | null>(
        () => draft?.files?.['CREATION_PASSPORT'] ?? null,
    );

    const [weight, setWeight] = useState(() => String(draft?.garment.dimensions?.weightG ?? ''));
    const parsedWeight = weight === '' ? undefined : nonNegativeInteger(weight, 50000);
    const weightInvalid = parsedWeight === null || parsedWeight === 0;

    const persistedGarment = draft?.garment;
    useEffect(() => {
        if (persistedGarment) {
            setForm(persistedGarment);
            setWeight(String(persistedGarment.dimensions?.weightG ?? ''));
        }
    }, [persistedGarment]);

    const baseValidation = useMemo(() => validateStep(draftToValidationInput(draft, { garment: form })), [form, draft]);
    const validation = weightInvalid
        ? {
              ok: false as const,
              missing: [...(baseValidation.ok ? [] : baseValidation.missing), 'Poids : entier entre 1 et 50 000 g'],
          }
        : baseValidation;

    /** Sauvegarde les informations validées avant de poursuivre le passeport. */
    const handleNext = () => {
        if (!validation.ok || parsedWeight === null) return;
        setGarment(draftId, { ...form, mainPhotoUrl: '', dimensions: { ...form.dimensions, weightG: parsedWeight } });
        setFile(draftId, 'PRODUCT_PHOTO', photoFile);
        setFile(draftId, 'SALE_INVOICE', saleInvoiceFile);
        setFile(draftId, 'CREATION_PASSPORT', creationPassportFile);
        goNext('product', 'care');
    };

    /** Ajoute ou retire une taille disponible de la pièce. */
    const toggleSize = (size: string) => {
        const current = form.availableSizes ?? [];
        setForm((f) => ({
            ...f,
            availableSizes: current.includes(size) ? current.filter((s) => s !== size) : [...current, size],
        }));
    };

    return {
        draft,
        form,
        setForm,
        photoFile,
        setPhotoFile,
        saleInvoiceFile,
        setSaleInvoiceFile,
        creationPassportFile,
        setCreationPassportFile,
        validation,
        handleNext,
        toggleSize,
        weight,
        setWeight,
        weightInvalid,
    };
}
