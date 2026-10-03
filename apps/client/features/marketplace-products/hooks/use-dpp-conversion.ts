'use client';

import { useState } from 'react';
import { useConvertDppToProduct, useDppForm, useDppForms } from '@lumiris/api-client/react';
import { toast } from '@lumiris/ui/components/sonner';
import { useSubscription } from '@/lib/use-subscription';
import { EMPTY_SIZE_GUIDE, sizesOf } from '../models/product-payload';
import type { SizeGuideDraft, VariantRow } from '../models/product-payload';
import { convertedProductPayload } from '../models/conversion-model';
import { productErrorMessage } from '../models/product-error';

/** Pilote les saisies et la conversion du passeport sélectionné. */
export function useDppConversion(open: boolean, onOpenChange: (open: boolean) => void) {
    const { data: dpps = [], isLoading, error: dppsError } = useDppForms({ enabled: open });
    const convert = useConvertDppToProduct();

    const { hasActiveSubscription } = useSubscription();
    const sellBlocked = !hasActiveSubscription;

    const [dppFormId, setDppFormId] = useState('');
    const [priceEuros, setPriceEuros] = useState('');
    const [shippingEuros, setShippingEuros] = useState('');
    const [stock, setStock] = useState('');
    const [preparationDays, setPreparationDays] = useState('0');
    const [weightGrams, setWeightGrams] = useState('');
    const [variants, setVariants] = useState<VariantRow[]>([]);
    const [sizeGuide, setSizeGuide] = useState<SizeGuideDraft>(EMPTY_SIZE_GUIDE);
    const [returnPolicy, setReturnPolicy] = useState('');
    const [externalOrderUrl, setExternalOrderUrl] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');

    const { data: selectedDpp } = useDppForm(dppFormId, { enabled: open && dppFormId !== '' });
    const sizes = sizesOf(variants);
    const canSubmit = dppFormId !== '' && !convert.isPending && !sellBlocked && !isLoading && !dppsError;
    const [error, setError] = useState<string | null>(null);

    /** Réinitialise les saisies et erreurs de conversion. */
    const reset = () => {
        setError(null);
        setDppFormId('');
        setPriceEuros('');
        setShippingEuros('');
        setStock('');
        setPreparationDays('0');
        setWeightGrams('');
        setVariants([]);
        setSizeGuide(EMPTY_SIZE_GUIDE);
        setReturnPolicy('');
        setExternalOrderUrl('');
        setPhotoUrl('');
    };

    /** Valide les saisies avant de lancer la mutation demandée. */
    const submit = () => {
        if (!canSubmit) return;
        let payload;
        try {
            payload = convertedProductPayload({
                priceEuros,
                shippingEuros,
                stock,
                preparationDays,
                weightGrams,
                variants,
                sizeGuide,
                returnPolicy,
                externalOrderUrl,
                photoUrl,
            });
            setError(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Saisie invalide.';
            setError(message);
            toast.error(message);
            return;
        }
        convert.mutate(
            { dppFormId, payload },
            {
                /** Annonce la réussite et termine la mutation demandée. */
                onSuccess: (item) => {
                    toast.success('DPP converti en produit', {
                        description: `« ${item.name} » est en vente${item.inAppSale ? ' (paiement in-app)' : ''}.`,
                    });
                    reset();
                    onOpenChange(false);
                },
                /** Affiche la cause exacte de l’échec de la requête. */
                onError: (e) => {
                    const message = productErrorMessage(e);
                    setError(message);
                    toast.error('La conversion a échoué', { description: message });
                },
            },
        );
    };

    return {
        dpps,
        isLoading,
        dppsError,
        pending: convert.isPending,
        sellBlocked,
        dppFormId,
        setDppFormId,
        priceEuros,
        setPriceEuros,
        shippingEuros,
        setShippingEuros,
        stock,
        setStock,
        preparationDays,
        setPreparationDays,
        weightGrams,
        setWeightGrams,
        variants,
        setVariants,
        sizeGuide,
        setSizeGuide,
        returnPolicy,
        setReturnPolicy,
        externalOrderUrl,
        setExternalOrderUrl,
        photoUrl,
        setPhotoUrl,
        selectedDpp,
        sizes,
        canSubmit,
        reset,
        submit,
        error,
    };
}
