import Link from 'next/link';
import { LumirisLogo } from '@lumiris/ui/components/logo';

const footerColumns = [
    {
        title: 'Produit',
        links: [
            { label: 'Accueil', href: '/' },
            { label: 'Découvrir', href: '/decouvrir' },
            { label: 'ATELIER', href: '/atelier' },
            { label: 'VISION', href: '/vision' },
            { label: 'Méthode Iris', href: '/methode' },
        ],
    },
    {
        title: 'Ressources',
        links: [
            { label: 'Journal', href: '/journal' },
            { label: 'Réglementation', href: '/reglementation' },
        ],
    },
    {
        title: 'Légal',
        links: [
            { label: 'Mentions légales', href: '/mentions-legales' },
            { label: 'Confidentialité', href: '/confidentialite' },
            { label: 'CGU', href: '/cgu' },
            { label: 'Charte', href: '/charte-independance' },
        ],
    },
    {
        title: 'Suivre',
        links: [
            { label: 'LinkedIn', href: 'https://linkedin.com/company/lumiris', external: true },
            { label: 'Instagram', href: 'https://instagram.com/lumiris.app', external: true },
        ],
    },
];

export function Footer() {
    return (
        <footer className="relative border-t border-border bg-card">
            <div className="mx-auto max-w-6xl px-6 py-16">
                {/* Logo + tagline */}
                <div className="mb-12">
                    <Link href="/" className="mb-4 flex items-center gap-2.5" aria-label="Accueil LUMIRIS">
                        <LumirisLogo className="h-8 w-auto" />
                        <span className="text-lg font-semibold tracking-tight text-foreground">LUMIRIS</span>
                    </Link>
                    <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                        Le passeport numérique du textile artisanal français, et le scanner universel des DPP européens.
                    </p>
                </div>

                {/* 4-column grid */}
                <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
                    {footerColumns.map((column) => (
                        <div key={column.title}>
                            <h3 className="mb-4 text-sm font-semibold text-foreground">{column.title}</h3>
                            <ul className="flex flex-col gap-2.5">
                                {column.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            {...('external' in link && link.external
                                                ? { target: '_blank', rel: 'noopener noreferrer' }
                                                : {})}
                                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Copyright bar */}
                <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-8 sm:flex-row sm:items-center">
                    <p className="text-xs text-muted-foreground">© 2026 LUMIRIS. Tous droits réservés.</p>
                    <p className="text-xs text-muted-foreground">
                        Prêt pour l&apos;ESPR / AGEC · Construit en transparence radicale.
                    </p>
                </div>
            </div>
        </footer>
    );
}
