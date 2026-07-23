import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shirt, BadgeCheck } from 'lucide-react';
import { IrisGrade } from '@lumiris/scoring-ui';
import { cn } from '@lumiris/ui/lib/cn';
import { formatCents, type MarketplaceItem } from '@/lib/marketplace';

interface BoutiqueCardProps {
    item: MarketplaceItem;
    index: number;
    featured?: boolean;
}

export function BoutiqueCard({ item, index, featured = false }: BoutiqueCardProps) {
    const grade = item.irisGrade;
    const isE = grade === 'E';
    const lowStock = item.stock <= 2;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 + index * 0.03 }}
        >
            <Link
                to={`/boutique/${item.id}`}
                className={cn(
                    'bg-card group relative flex overflow-hidden rounded-2xl border text-left transition-colors',
                    'border-border/60 hover:border-border opal-shadow',
                    featured ? 'flex-row' : 'flex-col',
                )}
                style={isE ? { filter: 'saturate(0.4) brightness(0.94)' } : undefined}
            >
                <div
                    className={cn(
                        'bg-muted relative flex items-center justify-center',
                        featured ? 'h-32 w-32 shrink-0' : 'h-32 w-full',
                    )}
                >
                    {item.photoUrl ? (
                        <img
                            src={item.photoUrl}
                            alt={item.name}
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                    ) : (
                        <Shirt className="text-muted-foreground/25 h-10 w-10" strokeWidth={1.5} aria-hidden />
                    )}
                    {grade ? (
                        <span className="absolute right-2 top-2">
                            <IrisGrade grade={grade} size="sm" tone="solid" />
                        </span>
                    ) : null}
                    <span
                        className="border-primary/20 bg-card/95 text-primary absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold backdrop-blur-sm"
                        title="Passeport Lumiris vérifié"
                    >
                        <BadgeCheck className="h-3 w-3" strokeWidth={1.5} aria-hidden />
                        DPP vérifié
                    </span>
                </div>

                <div className="flex flex-1 flex-col justify-center p-3">
                    <h3
                        className={cn(
                            'text-foreground truncate font-semibold leading-tight',
                            featured ? 'text-sm' : 'text-xs',
                        )}
                    >
                        {item.name}
                    </h3>
                    <p className="text-muted-foreground mt-0.5 truncate text-[11px]">{item.artisanName}</p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                        <p className="text-foreground font-mono text-sm font-semibold">{formatCents(item.priceCents)}</p>
                        {lowStock ? (
                            <span className="text-lumiris-amber text-[10px] font-medium">
                                {item.stock === 0 ? 'Épuisé' : `Plus que ${item.stock}`}
                            </span>
                        ) : null}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
