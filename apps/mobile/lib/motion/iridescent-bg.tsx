'use client';

import { motion } from 'framer-motion';

interface IridescentBackgroundProps {
    intensity?: 'subtle' | 'default';
}

export function IridescentBackground({ intensity = 'default' }: IridescentBackgroundProps) {
    const opacityA = intensity === 'subtle' ? 0.04 : 0.08;
    const opacityB = intensity === 'subtle' ? 0.03 : 0.06;
    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <motion.div
                className="absolute -top-24 -right-24 h-[40vh] w-[40vh] rounded-full blur-[100px] motion-reduce:hidden"
                style={{
                    background: 'radial-gradient(circle, #06b6d4, #8021f3, transparent)',
                    opacity: opacityA,
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
                className="absolute -bottom-20 -left-20 h-[30vh] w-[30vh] rounded-full blur-[80px] motion-reduce:hidden"
                style={{
                    background: 'radial-gradient(circle, #8021f3, #06b6d4, transparent)',
                    opacity: opacityB,
                }}
                animate={{ rotate: -360 }}
                transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
            />
        </div>
    );
}
