import type { Metadata, Viewport } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import { ApiProvider } from '@lumiris/api-client/react';
import { env } from '@/env';
import { Header } from '@/features/header';
import { Footer } from '@/features/footer';
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

const SITE_URL = 'https://lumiris.fr';
const TITLE_DEFAULT = 'LUMIRIS - Le passeport numérique du textile artisanal français';
const DESCRIPTION =
    "LUMIRIS publie le passeport numérique de chaque pièce d'artisan textile français : matières, étapes, lieu, score Iris. Aucun acteur n'achète son score.";

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: TITLE_DEFAULT,
        template: '%s · LUMIRIS',
    },
    description: DESCRIPTION,
    alternates: {
        canonical: '/',
    },
    openGraph: {
        type: 'website',
        locale: 'fr_FR',
        url: SITE_URL,
        siteName: 'LUMIRIS',
        title: TITLE_DEFAULT,
        description: DESCRIPTION,
    },
    twitter: {
        card: 'summary_large_image',
        title: TITLE_DEFAULT,
        description: DESCRIPTION,
    },
};

export const viewport: Viewport = {
    themeColor: '#f8fafc',
    width: 'device-width',
    initialScale: 1,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" className={`${inter.variable} ${geistMono.variable} bg-background`}>
            <body className="font-sans antialiased">
                <ApiProvider baseUrl={env.NEXT_PUBLIC_API_BASE_URL}>
                    <WebVitals />
                    <Header />
                    <main>{children}</main>
                    <Footer />
                </ApiProvider>
            </body>
        </html>
    );
}
