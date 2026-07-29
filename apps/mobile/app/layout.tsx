import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Toaster } from '@lumiris/ui/components/sonner';

// Polices auto-hébergées (@fontsource) plutôt que next/font/google : le bundle Tauri doit
// rester utilisable hors ligne et le build ne doit dépendre d'aucun CDN.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/geist-mono/400.css';
import '@fontsource/geist-mono/500.css';

import { ClientApiProvider } from '@/lib/api-provider';
import { AppShell } from '@/features/app-shell';
import { WebVitals } from './web-vitals';
import './globals.css';

export const metadata: Metadata = {
    title: 'Lumiris Vision',
    description:
        'Le scanner universel des passeports numériques européens. Scannez un produit, révélez son histoire et son score Iris V2.',
    icons: {
        icon: '/icon.svg',
        apple: '/icon.svg',
    },
};

export const viewport: Viewport = {
    themeColor: '#ffffff',
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    // Pas de verrouillage du zoom (maximumScale/userScalable) : le pinch-to-zoom doit rester
    // disponible pour respecter WCAG 1.4.4 (redimensionnement du texte).
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" className="bg-background">
            <body className="font-sans antialiased">
                <ClientApiProvider>
                    <WebVitals />
                    <Toaster
                        position="top-center"
                        offset="max(env(safe-area-inset-top), 1rem)"
                        visibleToasts={3}
                        closeButton={false}
                    />
                    <AppShell>
                        <Suspense fallback={null}>{children}</Suspense>
                    </AppShell>
                </ClientApiProvider>
            </body>
        </html>
    );
}
