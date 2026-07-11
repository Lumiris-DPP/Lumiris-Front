'use client';

import { useState, type ChangeEvent } from 'react';
import { readFileAsDataUrl } from '@lumiris/utils';

export interface UseFileUploadOptions {
    /** Max file size in bytes; larger files are rejected. */
    maxBytes?: number;
    /** Human label for the size limit, shown in the error message (e.g. "5 Mo"). */
    maxLabel?: string;
    /** Initial data URI, e.g. an already-attached document. */
    initialDataUri?: string;
}

export interface FileUpload {
    dataUri: string;
    name: string;
    error: string;
    reading: boolean;
    /** Reads the chosen `<input type="file">` file to a data URI, then clears the input. */
    onChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
    /** Imperatively set the data URI (e.g. to seed or clear it). */
    setDataUri: (value: string) => void;
    reset: () => void;
}

/**
 * Manages a single document upload (size validation + read to data URI) with
 * `reading`/`error` state. Replaces the repeated file-read boilerplate in forms.
 */
export function useFileUpload({ maxBytes, maxLabel, initialDataUri = '' }: UseFileUploadOptions = {}): FileUpload {
    const [dataUri, setDataUri] = useState(initialDataUri);
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [reading, setReading] = useState(false);

    async function onChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        if (maxBytes && file.size > maxBytes) {
            setError(`Fichier trop volumineux (${maxLabel ?? `${maxBytes} o`} max).`);
            return;
        }
        setError('');
        setReading(true);
        try {
            setDataUri(await readFileAsDataUrl(file));
            setName(file.name);
        } catch {
            setError('Impossible de lire le fichier.');
        } finally {
            setReading(false);
        }
    }

    function reset() {
        setDataUri('');
        setName('');
        setError('');
        setReading(false);
    }

    return { dataUri, name, error, reading, onChange, setDataUri, reset };
}
