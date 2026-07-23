import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Self-hosted fonts — exposed as --font-inter / --font-geist-mono in index.css.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/geist-mono/400.css';
import '@fontsource/geist-mono/500.css';

import { Toaster } from '@lumiris/ui/components/sonner';
import { ClientApiProvider } from '@/lib/api-provider';
import { WebVitals } from './web-vitals';
import { App } from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

createRoot(root).render(
    <StrictMode>
        <BrowserRouter>
            <ClientApiProvider>
                <WebVitals />
                <Toaster
                    position="top-center"
                    offset="max(env(safe-area-inset-top), 1rem)"
                    visibleToasts={3}
                    closeButton={false}
                />
                <App />
            </ClientApiProvider>
        </BrowserRouter>
    </StrictMode>,
);
