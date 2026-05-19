import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { AdminUserProvider, AuditLogProvider } from '@/lib/auth';
import { Sidebar } from '@/features/sidebar';
import { TopBar } from '@/features/top-bar';
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
    title: 'LUMIRIS | Console ATELIER',
    description: 'Console interne LUMIRIS — audit, curation et gouvernance des passeports produits numériques (DPP).',
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
                <WebVitals />
                <AdminUserProvider>
                    <AuditLogProvider>
                        <div className="bg-background min-h-screen">
                            <Sidebar />
                            <TopBar />
                            <main className="ml-60 pt-14">
                                <div className="p-6 lg:p-8">{children}</div>
                            </main>
                        </div>
                    </AuditLogProvider>
                </AdminUserProvider>
                {process.env.NODE_ENV === 'production' && <Analytics />}
            </body>
        </html>
    );
}
