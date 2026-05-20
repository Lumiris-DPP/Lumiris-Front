'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan } from 'lucide-react';
import { EASE_OUT, SPRING_BOUNCY } from '@/lib/motion';

// `memo` impératif : le parent boucle en rAF, un re-render casserait l'animation `iris-breathe`.
export type IrisRingStatus = 'idle' | 'scanning' | 'denied' | 'unreadable' | 'unknown' | 'matched';

interface IrisRingProps {
    status: IrisRingStatus;
}

function IrisRingImpl({ status }: IrisRingProps) {
    const isScanning = status === 'scanning';
    const isMatched = status === 'matched';

    return (
        <div className="relative flex items-center justify-center">
            <motion.div
                className="absolute h-[clamp(14rem,72vw,17rem)] w-[clamp(14rem,72vw,17rem)] rounded-full motion-reduce:hidden"
                style={{
                    background:
                        'conic-gradient(from 0deg, oklch(60% 0.13 195deg / 12%), oklch(55% 0.18 160deg / 8%), oklch(72% 0.16 85deg / 4%), transparent, oklch(60% 0.13 195deg / 12%))',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                aria-hidden
            />

            <motion.div
                className="border-border/50 bg-glass relative flex h-[clamp(13rem,68vw,16rem)] w-[clamp(13rem,68vw,16rem)] items-center justify-center rounded-full border backdrop-blur-2xl"
                style={{
                    animation: isScanning || isMatched ? 'none' : 'iris-breathe 4s ease-in-out infinite',
                }}
                animate={
                    isMatched ? { scale: [1, 0.88, 1.06, 1] } : isScanning ? { scale: [1, 1.02, 0.99, 1.01, 1] } : {}
                }
                transition={isMatched ? EASE_OUT : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
                <div className="border-border/25 pointer-events-none absolute h-[80%] w-[80%] rounded-full border" />
                <div className="border-border/15 pointer-events-none absolute h-[62%] w-[62%] rounded-full border" />
                <div className="border-border/10 pointer-events-none absolute h-[44%] w-[44%] rounded-full border" />

                <AnimatePresence>
                    {isScanning ? (
                        <motion.div
                            key="scanline"
                            className="absolute inset-4 overflow-hidden rounded-full motion-reduce:hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            aria-hidden
                        >
                            <motion.div
                                className="absolute left-0 right-0 h-px"
                                style={{
                                    background:
                                        'linear-gradient(90deg, transparent, oklch(60% 0.13 195deg), transparent)',
                                    boxShadow: '0 0 12px oklch(60% 0.13 195deg / 40%)',
                                }}
                                initial={{ top: '0%' }}
                                animate={{ top: ['0%', '100%', '0%'] }}
                                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                            />
                        </motion.div>
                    ) : null}
                </AnimatePresence>

                <div className="relative z-10 flex flex-col items-center gap-2">
                    <AnimatePresence mode="wait">
                        {isMatched ? (
                            <motion.div
                                key="matched"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={SPRING_BOUNCY}
                                className="flex flex-col items-center gap-1.5"
                            >
                                <div
                                    className="bg-iris-grade-a h-5 w-5 rounded-full"
                                    style={{ boxShadow: '0 0 16px oklch(55% 0.18 160deg / 40%)' }}
                                    aria-hidden
                                />
                                <span className="text-foreground text-[11px] font-bold uppercase tracking-[0.15em]">
                                    Locked
                                </span>
                            </motion.div>
                        ) : isScanning ? (
                            <motion.div
                                key="scanning"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-2"
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                                >
                                    <Scan className="text-iris-grade-b h-7 w-7" />
                                </motion.div>
                                <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.15em]">
                                    Scanning
                                </span>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-2"
                            >
                                <Scan className="text-muted-foreground/50 h-7 w-7" />
                                <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-[0.12em]">
                                    Approche le QR
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox="0 0 256 256"
                    preserveAspectRatio="none"
                    aria-hidden
                >
                    {(
                        [
                            'M 40 8 L 8 8 L 8 40',
                            'M 216 8 L 248 8 L 248 40',
                            'M 40 248 L 8 248 L 8 216',
                            'M 216 248 L 248 248 L 248 216',
                        ] as const
                    ).map((d) => (
                        <motion.path
                            key={d}
                            d={d}
                            fill="none"
                            strokeWidth="1.5"
                            className={isMatched ? 'stroke-iris-grade-a' : 'stroke-border'}
                            animate={{ opacity: 1 }}
                        />
                    ))}
                </svg>
            </motion.div>
        </div>
    );
}

export const IrisRing = memo(IrisRingImpl);
