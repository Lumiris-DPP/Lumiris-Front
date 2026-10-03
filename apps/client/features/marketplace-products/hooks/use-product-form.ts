'use client';

import { useEffect, useState } from 'react';
import type { SyntheticEvent } from 'react';
import type { MarketplaceItem } from '@lumiris/api-client';
import { useDppForms, useUpdateProduct } from '@lumiris/api-client/react';
import { toast } from '@lumiris/ui/components/sonner';
import { initialState, editedProductPayload } from '../models/product-form-model';
import type { FormState } from '../models/product-form-model';
import { sizesOf } from '../models/product-payload';
import { productErrorMessage } from '../models/product-error';

/** Pilote les saisies et la sauvegarde du produit édité. */
export function useProductForm(open: boolean, onOpenChange: (open: boolean) => void, product?: MarketplaceItem) {
    const [form, setForm] = useState<FormState>(() => initialState(product));
    const [error, setError] = useState<string | null>(null);
    const { data: dpps = [] } = useDppForms({ enabled: open });
    const updateMutation = useUpdateProduct();
    const pending = updateMutation.isPending;
    const sizes = sizesOf(form.variants);

    useEffect(() => {
        if (open) {
            setForm(initialState(product));
            setError(null);
        }
    }, [open, product]);

    /** Met à jour une saisie du produit sans écraser les autres champs. */
    const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

    /** Valide les saisies avant de demander la modification du produit. */
    const onSubmit = (event: SyntheticEvent) => {
        event.preventDefault();
        if (pending || !product) return;
        let payload;
        try {
            payload = editedProductPayload(form, product.currency);
            setError(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Saisie invalide.';
            setError(message);
            toast.error(message);
            return;
        }
        /** Annonce la réussite et termine la mutation demandée. */
        const onSuccess = () => {
            toast.success('Produit mis à jour.');
            onOpenChange(false);
        };
        /** Affiche la cause exacte de l’échec de la requête. */
        const onError = (error: Error) => {
            const message = productErrorMessage(error);
            setError(message);
            toast.error(message);
        };
        updateMutation.mutate({ id: product.id, payload }, { onSuccess, onError });
    };

    return { form, set, dpps, pending, sizes, onSubmit, error };
}
