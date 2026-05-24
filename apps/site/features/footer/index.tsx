import Link from 'next/link';

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
        <footer className="border-border bg-card relative border-t">
            <div className="mx-auto max-w-6xl px-6 py-16">
                {/* Logo + tagline */}
                <div className="mb-12">
                    <Link href="/" className="mb-4 flex items-center gap-2.5" aria-label="Accueil LUMIRIS">
                        <div className="relative h-8 w-8">
                            <div className="prismatic-bg absolute inset-0 rounded-lg opacity-90" />
                            <div className="bg-card absolute inset-[2.5px] flex items-center justify-center rounded-[6px]">
                                <span className="text-foreground font-mono text-xs font-bold">L</span>
                            </div>
                        </div>
                        <span className="text-foreground text-lg font-semibold tracking-tight">LUMIRIS</span>
                    </Link>
                    <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
                        Le passeport numérique du textile artisanal français, et le scanner universel des DPP européens.
                    </p>
                </div>

                {/* 4-column grid */}
                <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
                    {footerColumns.map((column) => (
                        <div key={column.title}>
                            <h3 className="text-foreground mb-4 text-sm font-semibold">{column.title}</h3>
                            <ul className="flex flex-col gap-2.5">
                                {column.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            {...('external' in link && link.external
                                                ? { target: '_blank', rel: 'noopener noreferrer' }
                                                : {})}
                                            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
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
                <div className="border-border mt-12 flex flex-col items-start justify-between gap-3 border-t pt-8 sm:flex-row sm:items-center">
                    <p className="text-muted-foreground text-xs">© 2026 LUMIRIS. Tous droits réservés.</p>
                    <p className="text-muted-foreground text-xs">
                        Conforme ESPR / AGEC · Construit en transparence radicale.
                    </p>
                </div>
            </div>
        </footer>
    );
}
