import '../css/app.css';
import './bootstrap';

import { addCollection } from '@iconify/react';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

import { offlineCollections } from './lib/offline-icons';

// Daftarkan ikon offline agar @iconify/react tidak pernah fetch api.iconify.design
// (diblokir CSP `default-src 'self'` / connect-src). Dihasilkan oleh scripts/generate-icons.mjs.
offlineCollections.forEach((collection) => addCollection(collection));

const appName = import.meta.env?.VITE_APP_NAME || 'SIGURU';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx') as Record<string, () => Promise<{ default: React.ComponentType }>>,
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#111827',
    },
});
