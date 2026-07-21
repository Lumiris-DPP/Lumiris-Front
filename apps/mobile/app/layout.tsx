import type { Metadata, Viewport } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import { Toaster } from '@lumiris/ui/components/sonner';

import { ClientApiProvider } from '@/lib/api-provider';
import { AppShell } from '@/features/app-shell';
import { WebVitals } from './web-vitals';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

const geistMono = Geist_Mono({
    subsets: ['latin'],
    variable: '--font-geist-mono',
});

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
            <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
                <ClientApiProvider>
                    <WebVitals />
                    <Toaster
                        position="top-center"
                        offset="max(env(safe-area-inset-top), 1rem)"
                        visibleToasts={3}
                        closeButton={false}
                    />
                    <AppShell>{children}</AppShell>
                </ClientApiProvider>
            </body>
        </html>
    );
}
