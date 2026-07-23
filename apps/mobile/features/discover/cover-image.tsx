import type { IrisGrade, JournalCategory } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';

interface CoverImageProps {
    src?: string;
    alt: string;
    category: JournalCategory;
    grade: IrisGrade;
    sizes: string;
    className?: string;
    priority?: boolean;
}

const CATEGORY_ACCENT: Record<JournalCategory, string> = {
    'portrait-artisan': 'var(--lumiris-amber)',
    'savoir-faire': 'var(--lumiris-cyan)',
    entretien: 'var(--lumiris-emerald)',
    reglementation: 'var(--lumiris-rose)',
};

export function CoverImage({ src, alt, category, grade, className, priority = false }: CoverImageProps) {
    if (src) {
        return (
            <img
                src={src}
                alt={alt}
                loading={priority ? undefined : 'lazy'}
                className={cn('absolute inset-0 h-full w-full object-cover', className)}
            />
        );
    }

    return (
        <div
            aria-hidden
            className={cn('absolute inset-0', className)}
            style={{
                background: `radial-gradient(at 25% 20%, color-mix(in oklch, var(--iris-grade-${grade.toLowerCase()}) 70%, transparent), transparent 65%), linear-gradient(135deg, var(--iris-grade-${grade.toLowerCase()}), ${CATEGORY_ACCENT[category]})`,
            }}
        />
    );
}
