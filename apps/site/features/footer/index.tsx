import Link from 'next/link';

const legalLinks = [
    { label: 'Mentions légales', href: '/mentions-legales' },
    { label: 'Politique de confidentialité', href: '/confidentialite' },
    { label: 'CGV / CGU', href: '/cgu' },
    { label: 'Charte d’indépendance', href: '/charte-independance' },
];

export function Footer() {
    return (
        <footer className="border-border bg-card relative border-t">
            <div className="mx-auto max-w-6xl px-6 py-12">
                <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
                    <div className="max-w-md">
                        <Link href="/" className="mb-3 flex items-center gap-2" aria-label="Accueil LUMIRIS">
                            <div className="relative h-7 w-7">
                                <div className="prismatic-bg absolute inset-0 rounded-lg opacity-90" />
                                <div className="bg-card absolute inset-[2.5px] flex items-center justify-center rounded-[5px]">
                                    <span className="text-foreground font-mono text-[10px] font-bold">L</span>
                                </div>
                            </div>
                            <span className="text-foreground text-base font-semibold tracking-tight">LUMIRIS</span>
                        </Link>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Le passeport numérique du textile artisanal français, et le scanner universel des DPP
                            européens. Un scan, une histoire, un score Iris.
                        </p>
                    </div>

                    <ul className="flex flex-wrap gap-x-6 gap-y-2">
                        {legalLinks.map((link) => (
                            <li key={link.label}>
                                <Link
                                    href={link.href}
                                    className="text-muted-foreground hover:text-foreground text-xs transition-colors"
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="border-border mt-10 flex flex-col items-start justify-between gap-2 border-t pt-6 sm:flex-row sm:items-center">
                    <p className="text-muted-foreground text-xs">© 2026 LUMIRIS. Tous droits réservés.</p>
                    <p className="text-muted-foreground text-xs">
                        Conforme ESPR / AGEC · Construit en transparence radicale.
                    </p>
                </div>
            </div>
        </footer>
    );
}
