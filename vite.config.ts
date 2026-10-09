import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      {
        name: 'vite-ws-silent-shim',
        transformIndexHtml: {
          order: 'pre',
          handler() {
            return [
              {
                tag: 'script',
                injectTo: 'head-prepend',
                children: `(function() {
  if (typeof window === 'undefined') return;
  var RealWS = window.WebSocket;
  if (!RealWS) return;
  window.WebSocket = function(url, protocols) {
    if (protocols === 'vite-hmr' || (typeof url === 'string' && (url.indexOf('token=') !== -1 || url.indexOf('vite') !== -1))) {
      var listeners = {};
      var fakeWs = {
        readyState: 1,
        CONNECTING: 0,
        OPEN: 1,
        CLOSING: 2,
        CLOSED: 3,
        binaryType: 'blob',
        extensions: '',
        protocol: 'vite-hmr',
        url: url,
        bufferedAmount: 0,
        onopen: null,
        onclose: null,
        onerror: null,
        onmessage: null,
        addEventListener: function(event, fn) {
          listeners[event] = listeners[event] || [];
          listeners[event].push(fn);
          if (event === 'open') {
            setTimeout(function() {
              if (typeof fakeWs.onopen === 'function') fakeWs.onopen({ type: 'open' });
              fn({ type: 'open' });
            }, 0);
          }
        },
        removeEventListener: function(event, fn) {
          if (!listeners[event]) return;
          listeners[event] = listeners[event].filter(function(f) { return f !== fn; });
        },
        dispatchEvent: function() { return true; },
        send: function() {},
        close: function() {
          fakeWs.readyState = 3;
          if (typeof fakeWs.onclose === 'function') fakeWs.onclose({ wasClean: true, code: 1000, reason: '' });
          (listeners['close'] || []).forEach(function(fn) { fn({ wasClean: true, code: 1000, reason: '' }); });
        }
      };
      return fakeWs;
    }
    return new RealWS(url, protocols);
  };
  window.WebSocket.prototype = RealWS.prototype;
  window.WebSocket.CONNECTING = 0;
  window.WebSocket.OPEN = 1;
  window.WebSocket.CLOSING = 2;
  window.WebSocket.CLOSED = 3;
})();`,
              },
            ];
          },
        },
      },
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          id: '/',
          name: 'Cinebook - Filmes, Séries e Livros',
          short_name: 'Cinebook',
          description: 'Sua rede social cultural para avaliar, organizar e compartilhar filmes, séries e livros.',
          theme_color: '#e11d48',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'tmdb-images-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/covers\.openlibrary\.org\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'openlibrary-covers-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
