'use client';

import { useEffect, useState } from 'react';
import { fetchDppForms, type DppFormSummaryDto } from './dpp-api';
import { useAuthStore } from './auth-store';

interface UseDppFormsResult {
    dppForms: DppFormSummaryDto[];
    loading: boolean;
    error: string | null;
}

export function useDppForms(): UseDppFormsResult {
    const token = useAuthStore((s) => s.token);
    const [dppForms, setDppForms] = useState<DppFormSummaryDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        setError(null);
        fetchDppForms(token)
            .then(setDppForms)
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoading(false));
    }, [token]);

    return { dppForms, loading, error };
}
