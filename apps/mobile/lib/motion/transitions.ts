import type { Transition, Variants } from 'framer-motion';

export const SPRING_TAB: Transition = { type: 'spring', stiffness: 400, damping: 35 };
export const SPRING_INDICATOR: Transition = { type: 'spring', stiffness: 400, damping: 30 };

export const fadeInOut: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.18 } },
    exit: { opacity: 0, transition: { duration: 0.12 } },
};

export const slideUpFade: Variants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
    exit: { opacity: 0, y: 8, transition: { duration: 0.14, ease: 'easeIn' } },
};
