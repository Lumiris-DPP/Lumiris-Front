import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { NetworkError, TimeoutError, createApiError } from '@lumiris/api-client';
import { refundFailureOf } from './refund-model';

test('un refus serveur libère l’intention et garde son motif : 400, 403, 404 et 422', () => {
    for (const status of [400, 403, 404, 422]) {
        const failure = refundFailureOf(createApiError(status, 'Cette commande est déjà intégralement remboursée.'));
        assert.deepEqual(failure, { release: true, message: 'Cette commande est déjà intégralement remboursée.' });
    }
});

test('une issue incertaine garde l’intention : réseau, délai, 409, 429 et 5xx', () => {
    const uncertain = [
        new NetworkError('Réponse perdue'),
        new TimeoutError(),
        new TypeError('Failed to fetch'),
        ...[409, 429, 500, 502, 503].map((status) => createApiError(status, 'Incident')),
    ];
    for (const error of uncertain) {
        const failure = refundFailureOf(error);
        assert.equal(failure.release, false, error.message);
        assert.match(failure.message, /Réponse non confirmée/);
    }
});
