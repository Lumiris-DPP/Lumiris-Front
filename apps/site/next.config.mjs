import createMDX from '@next/mdx';
import { createNextConfig } from '@lumiris/config/next';

const withMDX = createMDX({
    extension: /\.mdx?$/,
});

export default withMDX(
    createNextConfig({
        target: 'server',
        transpilePackages: ['react-leaflet', '@react-leaflet/core'],
        imageHosts: [{ protocol: 'https', hostname: 'placehold.co' }],
        pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
    }),
);
