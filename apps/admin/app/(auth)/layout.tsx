export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-10">
            <header className="text-muted-foreground text-sm font-medium uppercase tracking-widest">
                LUMIRIS · <span className="text-foreground">Console</span>
            </header>
            {children}
            <p className="text-muted-foreground max-w-sm text-center text-xs">
                Console lecture-seule · audit irréversible · score jamais payable
            </p>
        </div>
    );
}
