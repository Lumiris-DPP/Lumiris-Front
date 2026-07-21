import * as React from 'react';

import { cn } from '../../lib/cn';

/**
 * LUMIRIS brand mark — the official gradient sparkle logo.
 *
 * Single source of truth: import this everywhere the brand mark appears instead
 * of hand-rolling boxed icons or letter marks. Sizes by `className` (e.g.
 * `className="h-8 w-8"`); the intrinsic viewBox is landscape (755×532) and the
 * aspect ratio is always preserved, so it letterboxes inside a square box.
 *
 * The two linear gradients share fixed ids. Rendering several instances on one
 * page is safe: the definitions are identical, so a duplicate id resolves to the
 * same gradient.
 */
function LumirisLogo({
    className,
    title = 'LUMIRIS',
    ...props
}: React.ComponentProps<'svg'> & { title?: string }) {
    return (
        <svg
            viewBox="0 0 755 532"
            fill="none"
            role={title ? 'img' : undefined}
            aria-label={title || undefined}
            aria-hidden={title ? undefined : true}
            className={cn('h-auto w-auto', className)}
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            {title ? <title>{title}</title> : null}
            <path
                d="M366.991 7.93375C369.518 -2.64459 384.855 -2.64459 387.381 7.93375C427.025 173.944 470.642 216.807 639.567 255.768C650.332 258.25 650.332 273.323 639.567 275.806C470.642 314.766 427.025 357.629 387.381 523.641C384.855 534.218 369.517 534.218 366.991 523.641C327.347 357.629 283.729 314.766 114.803 275.806C104.04 273.323 104.04 258.25 114.803 255.768C283.729 216.807 327.347 173.944 366.991 7.93375ZM384.174 103.583C382.579 96.9067 372.901 96.9067 371.306 103.583C346.286 208.351 318.76 235.403 212.151 259.99C205.358 261.557 205.358 271.07 212.151 272.637C318.76 297.224 346.286 324.276 371.306 429.044C372.9 435.72 382.579 435.72 384.174 429.044C409.193 324.275 436.72 297.224 543.329 272.637C550.122 271.07 550.122 261.557 543.329 259.99C436.72 235.402 409.193 208.352 384.174 103.583Z"
                fill="url(#lumiris-logo-gradient-a)"
            />
            <path
                d="M322.665 32.3581C329.65 31.4783 335.169 38.0773 333.05 44.7909C329.615 55.6776 326.015 65.9466 322.21 75.6521C320.944 78.8795 318.01 81.1742 314.601 81.8047C156.552 111.039 85.4764 244.252 82.1789 250.597L76.3217 261.869C74.8199 264.759 74.8198 268.2 76.3216 271.09L82.1789 282.363C85.4811 288.721 156.749 422.293 315.258 451.279C318.692 451.907 321.647 454.224 322.906 457.48C326.652 467.166 330.2 477.408 333.587 488.259C335.681 494.964 330.171 501.541 323.201 500.672C109.049 473.978 13.3048 294.531 9.02948 286.3L1.12642 271.09C-0.375439 268.2 -0.375474 264.759 1.12632 261.869L9.02948 246.658C13.3039 238.434 108.892 59.2837 322.665 32.3581ZM422.451 44.923C420.328 38.1996 425.864 31.5942 432.857 32.4929C645.893 59.8712 741.176 238.446 745.444 246.658L753.347 261.869C754.849 264.759 754.848 268.2 753.347 271.09L745.444 286.3C741.175 294.518 645.737 473.394 432.32 500.541C425.341 501.429 419.815 494.846 421.913 488.131C425.311 477.252 428.871 466.986 432.63 457.28C433.886 454.036 436.825 451.725 440.244 451.089C598.032 421.714 668.998 288.707 672.293 282.363L678.15 271.09C679.652 268.2 679.652 264.759 678.15 261.869L672.293 250.597C669.002 244.265 598.229 111.618 440.903 81.9959C437.51 81.3569 434.59 79.068 433.328 75.8536C429.51 66.1281 425.898 55.836 422.451 44.923Z"
                fill="url(#lumiris-logo-gradient-b)"
            />
            <defs>
                <linearGradient
                    id="lumiris-logo-gradient-a"
                    x1="377.186"
                    y1="0"
                    x2="377.186"
                    y2="531.574"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#8021F3" />
                    <stop offset="1" stopColor="#0E6E88" />
                </linearGradient>
                <linearGradient
                    id="lumiris-logo-gradient-b"
                    x1="377.236"
                    y1="32.2789"
                    x2="377.236"
                    y2="500.749"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#8021F3" />
                    <stop offset="1" stopColor="#0E6E88" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export { LumirisLogo };
