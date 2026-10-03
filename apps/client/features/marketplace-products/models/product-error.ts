import { isApiError } from '@lumiris/api-client';

/** Restitue le message et les champs serveur sans inventer la cause du statut HTTP. */
export function productErrorMessage(error: Error): string {
    const fields = isApiError(error)
        ? Object.entries(error.fields ?? {}).flatMap(([field, messages]) =>
              messages.map((message) => `${field} : ${message}`),
          )
        : [];
    return [error.message || 'La requête a échoué.', ...fields].join(' ');
}
