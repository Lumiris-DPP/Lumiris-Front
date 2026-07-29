import { Sidebar } from '@/features/sidebar';
import { TopBar } from '@/features/top-bar';
import { AdminChrome } from '@/features/_shared/admin-chrome';

export default function AuthedLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <TopBar />
            <main className="ml-60 pt-14">
                <div className="p-6 lg:p-8">
                    <AdminChrome>{children}</AdminChrome>
                </div>
            </main>
        </div>
    );
}
