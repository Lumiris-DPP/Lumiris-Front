'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';

export type IrisRingStatus = 'idle' | 'scanning' | 'denied' | 'unreadable' | 'unknown' | 'matched';

interface IrisRingProps {
    status: IrisRingStatus;
}

// memo : parent boucle en rAF, un re-render casserait l'animation de pulsation.
function IrisRingImpl({ status }: IrisRingProps) {
    const isMatched = status === 'matched';
    return (
        <motion.div
            aria-hidden
            className={`h-[60vmin] w-[60vmin] rounded-full border-2 ${
                isMatched ? 'border-lumiris-emerald' : 'border-lumiris-cyan/60'
            }`}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
    );
}

export const IrisRing = memo(IrisRingImpl);
