import { expect, it } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { VariantPicker } from '@/features/boutique/components/variant-picker';
import type { MarketplaceItem } from '@/lib/marketplace/product';

it('conserve les axes disjoints accessibles et la rupture visible après sélection', () => {
    const item = {
        variants: [
            { id: 'm', sizeLabel: 'M', colorLabel: 'Bleu', stock: 2 },
            { id: 'l', sizeLabel: 'L', colorLabel: 'Rouge', stock: 2 },
            { id: 's', sizeLabel: 'S', colorLabel: 'Vert', stock: 0 },
        ],
    } as MarketplaceItem;
    const html = renderToStaticMarkup(
        <VariantPicker item={item} selection={{ size: 'M', color: 'Bleu' }} onChange={() => {}} />,
    );
    expect(html).toContain('>L<');
    expect(html).toContain('Rouge');
    expect(html).toContain('épuisée');
    expect(html).toContain('aria-pressed="true"');
});

it('ne verrouille pas les axes quand les combinaisons intermédiaires sont épuisées', () => {
    const item = {
        variants: [
            { id: 'mb', sizeLabel: 'M', colorLabel: 'Bleu', stock: 2 },
            { id: 'mr', sizeLabel: 'M', colorLabel: 'Rouge', stock: 0 },
            { id: 'lb', sizeLabel: 'L', colorLabel: 'Bleu', stock: 0 },
            { id: 'lr', sizeLabel: 'L', colorLabel: 'Rouge', stock: 2 },
        ],
    } as MarketplaceItem;
    const html = renderToStaticMarkup(
        <VariantPicker item={item} selection={{ size: 'M', color: 'Bleu' }} onChange={() => {}} />,
    );
    expect(html).not.toContain('aria-disabled="true"');
});
