import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';

import { AdminUserProvider, AuditLogProvider } from '@/lib/auth';
import { ClientApiProvider } from './api-provider';
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
    title: 'LUMIRIS | Console',
    description: 'Console LUMIRIS · audit, curation, gouvernance.',
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
                <ClientApiProvider>
                    <WebVitals />
                    <AdminUserProvider>
                        <AuditLogProvider>{children}</AuditLogProvider>
                    </AdminUserProvider>
                </ClientApiProvider>
                {process.env.NODE_ENV === 'production' && <Analytics />}
            </body>
        </html>
    );
}
