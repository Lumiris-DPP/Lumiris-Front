'use client';

// Helper visible uniquement en dev — à supprimer dès que le backend prend le relais.
// Grep `Démo · cliquer` pour retrouver tous les artefacts liés.

interface DemoAccount {
    email: string;
    label: string;
}

// Les comptes du seed backend (db/seed), seuls capables de s'authentifier : la connexion passe par
// POST /api/auth/sign-in. Les personas de curation ne sont qu'un habillage RBAC côté console, sans
// compte serveur — les proposer ici menait à « Identifiants invalides » à chaque essai.
const DEMO_ACCOUNTS: readonly DemoAccount[] = [{ email: 'admin@lumiris.com', label: 'Admin · mot de passe admin123' }];

interface DemoAccountsHelperProps {
    onSelect: (email: string) => void;
}

export function DemoAccountsHelper({ onSelect }: DemoAccountsHelperProps) {
    if (process.env.NODE_ENV === 'production') return null;

    return (
        <div className="space-y-1.5 px-2 text-xs text-muted-foreground">
            <p className="font-mono tracking-wider uppercase">Démo · cliquer pour pré-remplir</p>
            <ul className="space-y-0.5">
                {DEMO_ACCOUNTS.map((account) => (
                    <li key={account.email}>
                        <button
                            type="button"
                            onClick={() => onSelect(account.email)}
                            className="text-left font-mono transition-colors hover:text-foreground"
                        >
                            {account.email} <span className="text-muted-foreground/60">({account.label})</span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
