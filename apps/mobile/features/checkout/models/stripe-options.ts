// Prépare le secret et l’apparence du formulaire Stripe.
export function stripeOptions(clientSecret: string) {
    return {
        clientSecret,
        appearance: {
            theme: 'stripe' as const,
            variables: {
                colorPrimary: '#0e7490',
                colorText: '#1a1c20',
                colorTextSecondary: '#6b7280',
                colorBackground: '#ffffff',
                colorDanger: '#c0344d',
                borderRadius: '10px',
                spacingUnit: '4px',
                fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
            },
            rules: {
                '.Input': { border: '1px solid #e3e4e6', boxShadow: 'none' },
                '.Input:focus': { border: '1px solid #1a1c20', boxShadow: 'none' },
                '.Tab': { border: '1px solid #e3e4e6', boxShadow: 'none' },
                '.Tab--selected': { borderColor: '#0e7490', color: '#0e7490' },
            },
        },
    };
}
