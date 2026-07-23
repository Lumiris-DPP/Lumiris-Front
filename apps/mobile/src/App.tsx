import { lazy, Suspense, type ComponentType, type ReactElement } from 'react';
import { Outlet, useRoutes, type RouteObject } from 'react-router-dom';
import { AppShell } from '@/features/app-shell';
import { NotFound } from '@/components/not-found';

/** Wrap a dynamic import as a lazily code-split route element. */
const route = (load: () => Promise<{ default: ComponentType }>): ReactElement => {
    const Component = lazy(load);
    return <Component />;
};

/** Shared layout for every route: tab bar + offline banner (self-hides per route). */
function AppLayout(): ReactElement {
    return (
        <AppShell>
            <Outlet />
        </AppShell>
    );
}

const routes: RouteObject[] = [
    {
        element: <AppLayout />,
        children: [
            { index: true, element: route(() => import('./routes/home')) },
            { path: 'about', element: route(() => import('./routes/about')) },
            { path: 'artisans/:slug', element: route(() => import('./routes/artisans/$slug')) },
            {
                path: 'auth',
                children: [
                    { index: true, element: route(() => import('./routes/auth/index')) },
                    { path: 'sign-in', element: route(() => import('./routes/auth/sign-in')) },
                ],
            },
            {
                path: 'boutique',
                children: [
                    { index: true, element: route(() => import('./routes/boutique/index')) },
                    { path: ':id', element: route(() => import('./routes/boutique/$id')) },
                ],
            },
            { path: 'checkout', element: route(() => import('./routes/checkout')) },
            {
                path: 'commande/:id',
                children: [
                    { index: true, element: route(() => import('./routes/commande/$id/index')) },
                    { path: 'facture', element: route(() => import('./routes/commande/$id/facture')) },
                ],
            },
            {
                path: 'discover',
                children: [
                    { index: true, element: route(() => import('./routes/discover/index')) },
                    { path: 'for-you', element: route(() => import('./routes/discover/for-you')) },
                ],
            },
            { path: 'dpp/:gtin', element: route(() => import('./routes/dpp/$gtin')) },
            { path: 'garde-robe', element: route(() => import('./routes/garde-robe')) },
            { path: 'help', element: route(() => import('./routes/help')) },
            { path: 'journal/:slug', element: route(() => import('./routes/journal/$slug')) },
            { path: 'local', element: route(() => import('./routes/local')) },
            {
                path: 'me',
                children: [
                    { index: true, element: route(() => import('./routes/me/index')) },
                    { path: 'documents', element: route(() => import('./routes/me/documents')) },
                    { path: 'orders', element: route(() => import('./routes/me/orders')) },
                    { path: 'privacy', element: route(() => import('./routes/me/privacy')) },
                    { path: 'repairs', element: route(() => import('./routes/me/repairs')) },
                    { path: 'settings', element: route(() => import('./routes/me/settings')) },
                ],
            },
            {
                path: 'onboarding',
                children: [
                    { index: true, element: route(() => import('./routes/onboarding/index')) },
                    { path: 'profile', element: route(() => import('./routes/onboarding/profile')) },
                ],
            },
            { path: 'p/:code', element: route(() => import('./routes/p/$code')) },
            { path: 'panier', element: route(() => import('./routes/panier')) },
            { path: 'passeport/:id', element: route(() => import('./routes/passeport/$id')) },
            {
                path: 'retoucheurs/:slug',
                children: [
                    { index: true, element: route(() => import('./routes/retoucheurs/$slug/index')) },
                    { path: 'request', element: route(() => import('./routes/retoucheurs/$slug/request')) },
                ],
            },
            { path: 'scan/manual', element: route(() => import('./routes/scan/manual')) },
            {
                path: 'vault',
                children: [
                    { index: true, element: route(() => import('./routes/vault/index')) },
                    { path: 'add', element: route(() => import('./routes/vault/add')) },
                ],
            },
            { path: '*', element: <NotFound /> },
        ],
    },
];

export function App(): ReactElement | null {
    return <Suspense fallback={null}>{useRoutes(routes)}</Suspense>;
}
