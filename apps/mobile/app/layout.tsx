import type { Metadata, Viewport } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import { Toaster } from '@lumiris/ui/components/sonner';

import { ApiProvider } from '@lumiris/api-client/react';
import { env } from '@/env';
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
};

export const viewport: Viewport = {
    themeColor: '#ffffff',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="bg-background">
            <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
                <ApiProvider baseUrl={env.NEXT_PUBLIC_API_BASE_URL}>
                    <WebVitals />
                    <Toaster
                        position="top-center"
                        offset="max(env(safe-area-inset-top), 1rem)"
                        visibleToasts={3}
                        closeButton={false}
                    />
                    <AppShell>{children}</AppShell>
                </ApiProvider>
            </body>
        </html>
    );
}
