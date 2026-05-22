'use client';

// Helper visible uniquement en dev — à supprimer dès que le backend prend le relais.
// Grep `Démo · cliquer` pour retrouver tous les artefacts liés.

interface DemoAccount {
    email: string;
    label: string;
}

const DEMO_ACCOUNTS: readonly DemoAccount[] = [
    { email: 'lea.marchand@lumiris.fr', label: 'Admin' },
    { email: 'agathe.gervais@lumiris.fr', label: 'Lead curator' },
    { email: 'antoine.berger@lumiris.fr', label: 'Curator' },
    { email: 'thomas.morel@lumiris.fr', label: 'Billing ops' },
    { email: 'nadia.khelifi@lumiris.fr', label: 'DPO' },
];

interface DemoAccountsHelperProps {
    onSelect: (email: string) => void;
}

export function DemoAccountsHelper({ onSelect }: DemoAccountsHelperProps) {
    if (process.env.NODE_ENV === 'production') return null;

    return (
        <div className="text-muted-foreground space-y-1.5 px-2 text-xs">
            <p className="font-mono uppercase tracking-wider">Démo · cliquer pour pré-remplir</p>
            <ul className="space-y-0.5">
                {DEMO_ACCOUNTS.map((account) => (
                    <li key={account.email}>
                        <button
                            type="button"
                            onClick={() => onSelect(account.email)}
                            className="hover:text-foreground text-left font-mono transition-colors"
                        >
                            {account.email} <span className="text-muted-foreground/60">({account.label})</span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
