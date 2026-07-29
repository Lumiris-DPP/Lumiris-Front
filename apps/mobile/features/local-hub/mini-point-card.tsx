'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import type { LocalPoint } from './types';
import { PointCard } from './point-card';

interface MiniPointCardProps {
    point: LocalPoint;
    onClose: () => void;
}

export function MiniPointCard({ point, onClose }: MiniPointCardProps) {
    const prefersReduced = useReducedMotion();
    return (
        <motion.div
            key={`${point.kind}-${point.id}`}
            initial={prefersReduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="relative"
        >
            <PointCard point={point} index={0} />
            <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="absolute top-3 right-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/40 bg-background text-muted-foreground shadow-md backdrop-blur-md hover:text-foreground"
            >
                <X className="h-4 w-4" aria-hidden />
            </button>
        </motion.div>
    );
}
