import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { createClient } from '@lumiris/api-client';
import type { RefundInput } from '@lumiris/api-client';
import { forgetRefundOperation, readRefundOperation, rememberRefundOperation } from './refund-operation';

test('réponse perdue après commit : reprise persistée sans second remboursement puis nouvelle intention distincte', async () => {
    const values = new Map<string, string>();
    const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    const originalFetch = globalThis.fetch;
    Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => values.set(key, value),
            removeItem: (key: string) => values.delete(key),
        },
    });
    const ids = new Set<string>();
    const bodies: RefundInput[] = [];
    let refunded = 0;
    let loseResponse = true;
    globalThis.fetch = ((_url: unknown, options: RequestInit) => {
        const input = JSON.parse(options.body as string) as RefundInput;
        bodies.push(input);
        if (!ids.has(input.operationId)) {
            ids.add(input.operationId);
            refunded += input.amountCents!;
        }
        if (loseResponse) {
            loseResponse = false;
            return Promise.reject(new TypeError('Réponse perdue après commit'));
        }
        return Promise.resolve(new Response(null, { status: 204 }));
    }) as typeof fetch;
    try {
        const client = createClient({ baseUrl: 'https://simulation.invalid', maxRetries: 0 });
        const first = { operationId: crypto.randomUUID(), amountCents: 200, reason: 'Geste' };
        rememberRefundOperation('a', 'order', first);
        await assert.rejects(client.sellerOrders.refund('order', first));
        assert.equal(refunded, 200);
        assert.equal(readRefundOperation('b', 'order'), null);
        const resumed = readRefundOperation('a', 'order')!;
        await client.sellerOrders.refund('order', resumed);
        assert.equal(refunded, 200);
        assert.deepEqual(bodies[0], bodies[1]);
        forgetRefundOperation('a', 'order');
        const second = { ...first, operationId: crypto.randomUUID() };
        rememberRefundOperation('a', 'order', second);
        await client.sellerOrders.refund('order', second);
        assert.equal(refunded, 400);
        assert.notEqual(first.operationId, second.operationId);
    } finally {
        globalThis.fetch = originalFetch;
        if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
        else Reflect.deleteProperty(globalThis, 'localStorage');
    }
});
