import { createNextConfig } from '@lumiris/config/next';

export default createNextConfig({
    target: 'server',
    transpilePackages: ['@lumiris/scoring-ui'],
    redirects() {
        return [
            { source: '/iris', destination: '/passeports', permanent: false },
            { source: '/iris/:id', destination: '/passeports?id=:id', permanent: false },
            { source: '/retoucheurs', destination: '/reseau?tab=retoucheurs', permanent: false },
            { source: '/retoucheurs/:path*', destination: '/reseau?tab=retoucheurs', permanent: false },
            { source: '/vision-users', destination: '/reseau?tab=users', permanent: false },
            { source: '/vision-users/:path*', destination: '/reseau?tab=users', permanent: false },
            { source: '/billing', destination: '/revenus?tab=subscriptions', permanent: false },
            { source: '/billing/:path*', destination: '/revenus?tab=subscriptions', permanent: false },
            { source: '/affiliation', destination: '/revenus?tab=affiliation', permanent: false },
            { source: '/affiliation/:path*', destination: '/revenus?tab=affiliation', permanent: false },
            { source: '/gouvernance', destination: '/audit', permanent: false },
            { source: '/gouvernance/:path*', destination: '/audit', permanent: false },
        ];
    },
});
