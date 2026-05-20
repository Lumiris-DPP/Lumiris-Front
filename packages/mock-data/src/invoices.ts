import type { SupplierInvoice } from '@lumiris/types';

export const mockInvoices: readonly SupplierInvoice[] = [
    {
        id: 'inv-001',
        supplierId: 'sup-filature-bretagne',
        fileUrl: 'https://lumiris.fr/mock/inv/inv-001.pdf',
        uploadedAt: '2026-02-12T09:32:00Z',
        ocrExtracted: {
            supplierName: 'Filature Bretagne',
            invoiceDate: '2026-02-10',
            totalHt: 1480,
            currency: 'EUR',
            lineItems: [{ fiber: 'linen', label: 'Lin filé peigné 40 Nm', qty: 12, unit: 'kg' }],
        },
        linkedPassportIds: ['pass-marie-001', 'pass-marie-002', 'pass-pauline-001'],
    },
    {
        id: 'inv-002',
        supplierId: 'sup-tannerie-roux',
        fileUrl: 'https://lumiris.fr/mock/inv/inv-002.pdf',
        uploadedAt: '2026-01-28T11:05:00Z',
        ocrExtracted: {
            supplierName: 'Tannerie Roux',
            invoiceDate: '2026-01-25',
            totalHt: 3200,
            currency: 'EUR',
            lineItems: [
                { fiber: 'leather', label: 'Cuir tannage végétal box', qty: 6, unit: 'm²' },
                { fiber: 'leather', label: 'Cuir doublure veau', qty: 4, unit: 'm²' },
            ],
        },
        linkedPassportIds: ['pass-theo-001', 'pass-theo-002'],
    },
    {
        id: 'inv-003',
        supplierId: 'sup-laine-arles',
        fileUrl: 'https://lumiris.fr/mock/inv/inv-003.pdf',
        uploadedAt: '2026-03-04T08:50:00Z',
        ocrExtracted: {
            supplierName: 'Coopérative Laine d’Arles',
            invoiceDate: '2026-03-01',
            totalHt: 920,
            currency: 'EUR',
            lineItems: [{ fiber: 'wool', label: 'Laine mérinos d’Arles peignée', qty: 18, unit: 'kg' }],
        },
        linkedPassportIds: ['pass-claire-001', 'pass-nicolas-001'],
    },
    {
        id: 'inv-004',
        supplierId: 'sup-soie-cevennes',
        fileUrl: 'https://lumiris.fr/mock/inv/inv-004.pdf',
        uploadedAt: '2026-02-22T14:18:00Z',
        ocrExtracted: {
            supplierName: 'Magnanerie des Cévennes',
            invoiceDate: '2026-02-20',
            totalHt: 1750,
            currency: 'EUR',
            lineItems: [{ fiber: 'silk', label: 'Soie Cévennes - fil 21/23 deniers', qty: 4, unit: 'kg' }],
        },
        linkedPassportIds: ['pass-amelie-001', 'pass-leila-001'],
    },
    {
        id: 'inv-005',
        supplierId: 'sup-coton-bio-belgique',
        fileUrl: 'https://lumiris.fr/mock/inv/inv-005.pdf',
        uploadedAt: '2026-03-15T16:40:00Z',
        ocrExtracted: {
            supplierName: 'BioCotton BV - Gent',
            invoiceDate: '2026-03-12',
            totalHt: 640,
            currency: 'EUR',
            lineItems: [{ fiber: 'cotton', label: 'Coton bio recyclé pré-consommation', qty: 30, unit: 'kg' }],
        },
        linkedPassportIds: ['pass-jules-001'],
    },

    {
        id: 'inv-006',
        supplierId: 'sup-chanvre-allier',
        fileUrl: 'https://lumiris.fr/mock/inv/inv-006.pdf',
        uploadedAt: '2026-04-02T10:11:00Z',
        ocrExtracted: null,
        linkedPassportIds: ['pass-pauline-002'],
    },
    {
        id: 'inv-007',
        supplierId: 'sup-cachemire-mongolie',
        fileUrl: 'https://lumiris.fr/mock/inv/inv-007.pdf',
        uploadedAt: '2026-04-10T13:25:00Z',
        ocrExtracted: null,
        linkedPassportIds: ['pass-laurens-001'],
    },
    {
        id: 'inv-008',
        supplierId: 'sup-laine-tarn',
        fileUrl: 'https://lumiris.fr/mock/inv/inv-008.pdf',
        uploadedAt: '2026-04-22T09:01:00Z',
        ocrExtracted: null,
        linkedPassportIds: [],
    },
];

export function mockInvoiceById(id: string): SupplierInvoice | undefined {
    return mockInvoices.find((i) => i.id === id);
}
