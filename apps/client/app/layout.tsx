import type { Metadata, Viewport } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import { Toaster } from '@lumiris/ui/components/sonner';
import { ThemeProvider } from '@lumiris/ui/theme-provider';

import { ApiProvider } from '@lumiris/api-client/react';
import { env } from '@/env';
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
    title: {
        default: 'LUMIRIS Atelier - DPP textile artisanal',
        template: '%s · LUMIRIS Atelier',
    },
    description:
        'Outil B2B des artisans textile français pour créer, scorer et publier leurs passeports numériques produit (DPP).',
};

export const viewport: Viewport = {
    themeColor: '#fafaf7',
    width: 'device-width',
    initialScale: 1,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" className={`${inter.variable} ${geistMono.variable} bg-background`} suppressHydrationWarning>
            <body className="font-sans antialiased">
                <ApiProvider baseUrl={env.NEXT_PUBLIC_API_BASE_URL}>
                    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
                        <WebVitals />
                        {children}
                        <Toaster position="bottom-right" closeButton />
                    </ThemeProvider>
                </ApiProvider>
            </body>
        </html>
    );
}
