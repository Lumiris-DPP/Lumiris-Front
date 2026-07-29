export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 py-10">
            <header className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
                LUMIRIS · <span className="text-foreground">Console</span>
            </header>
            {children}
            <p className="max-w-sm text-center text-xs text-muted-foreground">
                Console lecture-seule · audit irréversible · score jamais payable
            </p>
        </div>
    );
}
