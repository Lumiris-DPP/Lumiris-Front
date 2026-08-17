import { createNextConfig } from '@lumiris/config/next';

export default createNextConfig({
    target: 'server',
    transpilePackages: ['@lumiris/scoring-ui', '@lumiris/mock-data'],
    imageHosts: [{ protocol: 'https', hostname: 'placehold.co' }],
});
