import { notFound } from 'next/navigation';
import type { GarmentKind } from '@lumiris/types';
import { Shop } from '@/features/shop';
import { SHOP_GARMENT_KINDS } from '@/lib/shop';

// `dynamicParams = false` + `generateStaticParams()` => `output: 'export'` Tauri-friendly.
export const dynamicParams = false;

export function generateStaticParams(): Array<{ category: GarmentKind }> {
    return SHOP_GARMENT_KINDS.map((category) => ({ category }));
}

interface ShopCategoryPageProps {
    params: Promise<{ category: string }>;
}

export default async function ShopCategoryPage({ params }: ShopCategoryPageProps) {
    const { category } = await params;
    if (!SHOP_GARMENT_KINDS.includes(category as GarmentKind)) {
        notFound();
    }
    return <Shop key={category} initialCategory={category} />;
}
