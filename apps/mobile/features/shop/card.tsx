import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shirt, Sparkles } from 'lucide-react';
import { gradeBackgroundSolid } from '@lumiris/scoring-ui';
import { cn } from '@lumiris/ui/lib/cn';
import type { ShopItem } from '@/lib/shop';

interface ShopCardProps {
    item: ShopItem;
    index: number;
}

export function ShopCard({ item, index }: ShopCardProps) {
    const { passport, score, artisanName, isFeatured } = item;
    const grade = score.grade;
    const isE = grade === 'E';
    const isA = grade === 'A';
    const cardStyle: React.CSSProperties = {
        ...(isE ? { filter: 'saturate(0.4) brightness(0.92)' } : {}),
        ...(isA ? { animation: 'iris-grade-a-glow 3s ease-in-out infinite' } : {}),
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + index * 0.03 }}
        >
            <Link
                to={`/passeport/${passport.id}`}
                className={cn(
                    'bg-card group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all',
                    'border-border/60 hover:border-border',
                )}
                style={cardStyle}
            >
                <div className="bg-secondary/50 relative flex h-28 items-center justify-center">
                    <Shirt className="text-muted-foreground/25 h-9 w-9" aria-hidden />
                    <div
                        className={cn(
                            'text-primary-foreground absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold',
                            gradeBackgroundSolid(grade),
                        )}
                        aria-label={`Iris grade ${grade}`}
                    >
                        {grade}
                    </div>
                    {isFeatured ? (
                        <span
                            className="border-lumiris-cyan/30 bg-card/95 text-lumiris-cyan absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide backdrop-blur-sm"
                            title="Atelier mis en avant"
                        >
                            <Sparkles className="h-2.5 w-2.5" />
                            Atelier+
                        </span>
                    ) : null}
                </div>

                <div className="p-3">
                    <h4 className="text-foreground truncate text-xs font-semibold leading-tight">
                        {passport.garment.reference}
                    </h4>
                    <p className="text-muted-foreground mt-0.5 truncate text-[11px]">{artisanName}</p>
                    <p className="text-foreground mt-1 text-xs font-bold">
                        {passport.garment.retailPrice}{' '}
                        {passport.garment.currency === 'EUR' ? '€' : passport.garment.currency}
                    </p>
                </div>
            </Link>
        </motion.div>
    );
}
