'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan } from 'lucide-react';

export type IrisRingStatus = 'idle' | 'scanning' | 'denied' | 'unreadable' | 'unknown' | 'matched';

interface IrisRingProps {
    status: IrisRingStatus;
}

// memo : parent boucle en rAF, un re-render casserait l'animation de pulsation.
function IrisRingImpl({ status }: IrisRingProps) {
    const isMatched = status === 'matched';
    const isScanning = status === 'scanning';

    return (
        <div className="relative flex items-center justify-center">
            {/* Outer prismatic conic ring (rotates slowly) */}
            <motion.div
                aria-hidden
                className="absolute h-[min(58vmin,17rem)] w-[min(58vmin,17rem)] rounded-full"
                style={{
                    background:
                        'conic-gradient(from 0deg, oklch(50% 0.094 220deg / 14%), oklch(54% 0.247 294deg / 10%), oklch(50% 0.192 1deg / 6%), transparent, oklch(50% 0.094 220deg / 14%))',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            />

            {/* Main iris — quasi-transparent disc so the camera shows through, breathing animation */}
            <motion.div
                aria-hidden
                className={`relative flex h-[min(52vmin,15rem)] w-[min(52vmin,15rem)] items-center justify-center rounded-full border-2 ${
                    isMatched ? 'border-lumiris-emerald' : 'border-lumiris-cyan/70'
                }`}
                style={{
                    background: 'oklch(100% 0 0deg / 6%)',
                    backdropFilter: 'blur(2px)',
                    animation: isScanning || isMatched ? 'none' : 'iris-breathe 4s ease-in-out infinite',
                }}
                animate={
                    isMatched ? { scale: [1, 0.88, 1.06, 1] } : isScanning ? { scale: [1, 1.02, 0.99, 1.01, 1] } : {}
                }
                transition={
                    isMatched
                        ? { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
                        : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
                }
            >
                {/* Concentric inner rings — white tints, lisibles sur n'importe quel fond caméra */}
                <div className="absolute h-[min(42vmin,12rem)] w-[min(42vmin,12rem)] rounded-full border border-white/25" />
                <div className="absolute h-[min(32vmin,9rem)] w-[min(32vmin,9rem)] rounded-full border border-white/15" />
                <div className="absolute h-[min(22vmin,6rem)] w-[min(22vmin,6rem)] rounded-full border border-white/10" />

                {/* Scanline sweep (only while scanning) */}
                <AnimatePresence>
                    {isScanning ? (
                        <motion.div
                            className="absolute inset-4 overflow-hidden rounded-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="bg-lumiris-cyan absolute left-0 right-0 h-px"
                                style={{ boxShadow: '0 0 12px var(--lumiris-cyan)' }}
                                initial={{ top: '0%' }}
                                animate={{ top: ['0%', '100%', '0%'] }}
                                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                            />
                        </motion.div>
                    ) : null}
                </AnimatePresence>

                {/* Center status icon — texte avec ombre pour lisibilité sur n'importe quel fond caméra */}
                {!isScanning && !isMatched ? (
                    <div
                        className="relative z-10 flex flex-col items-center gap-2"
                        style={{ filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.5))' }}
                    >
                        <Scan className="h-7 w-7 text-white/70" aria-hidden />
                        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/80">
                            Pointez vers un QR code
                        </span>
                    </div>
                ) : null}

                {/* Corner brackets — blanc par défaut, vert sauge en match */}
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 256 256" aria-hidden>
                    {[
                        'M 40 8 L 8 8 L 8 40',
                        'M 216 8 L 248 8 L 248 40',
                        'M 40 248 L 8 248 L 8 216',
                        'M 216 248 L 248 248 L 248 216',
                    ].map((d) => (
                        <path
                            key={d}
                            d={d}
                            fill="none"
                            strokeWidth="2"
                            className={isMatched ? 'stroke-lumiris-emerald' : 'stroke-white/60'}
                        />
                    ))}
                </svg>
            </motion.div>
        </div>
    );
}

export const IrisRing = memo(IrisRingImpl);
