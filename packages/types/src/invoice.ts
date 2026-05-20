import type { Fiber } from './passport';

export interface OcrLineItem {
    fiber?: Fiber;
    label: string;
    qty: number;
    unit: string;
}

export interface OcrExtraction {
    supplierName: string;
    invoiceDate: string;
    totalHt: number;
    currency: 'EUR';
    lineItems: readonly OcrLineItem[];
}

export interface SupplierInvoice {
    id: string;
    supplierId: string;
    fileUrl: string;
    ocrExtracted: OcrExtraction | null;
    uploadedAt: string;
    linkedPassportIds: readonly string[];
}
