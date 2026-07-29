import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        h1: ({ children }) => (
            <h1 className="mt-10 mb-6 text-3xl font-bold tracking-tight text-foreground first:mt-0 sm:text-4xl">
                {children}
            </h1>
        ),
        h2: ({ children }) => (
            <h2 className="mt-12 mb-4 text-2xl font-semibold tracking-tight text-foreground">{children}</h2>
        ),
        h3: ({ children }) => (
            <h3 className="mt-8 mb-3 text-xl font-semibold tracking-tight text-foreground">{children}</h3>
        ),
        p: ({ children }) => <p className="my-5 text-base leading-relaxed text-foreground/90">{children}</p>,
        ul: ({ children }) => (
            <ul className="my-5 list-disc space-y-2 pl-6 text-base leading-relaxed text-foreground/90">{children}</ul>
        ),
        ol: ({ children }) => (
            <ol className="my-5 list-decimal space-y-2 pl-6 text-base leading-relaxed text-foreground/90">
                {children}
            </ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        blockquote: ({ children }) => (
            <blockquote className="border-grade-a/40 my-6 border-l-4 pl-4 text-foreground/80 italic">
                {children}
            </blockquote>
        ),
        a: ({ href, children }) => {
            const url = href ?? '#';
            const isExternal = /^https?:/.test(url);
            if (isExternal) {
                return (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-grade-a underline-offset-4 hover:underline"
                    >
                        {children}
                    </a>
                );
            }
            return (
                <Link href={url} className="text-grade-a underline-offset-4 hover:underline">
                    {children}
                </Link>
            );
        },
        hr: () => <hr className="my-10 border-border" />,
        code: ({ children }) => (
            <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground">{children}</code>
        ),
        ...components,
    };
}
