import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:5001',
                changeOrigin: true,
            },
            '/socket.io': {
                target: 'http://127.0.0.1:5001',
                changeOrigin: true,
                ws: true,
                configure: (proxy, _options) => {
                    proxy.on('error', (err, _req, _res) => {
                        // Suppress noisy EPIPE/ECONNRESET errors when the backend is restarting
                        if (err.code === 'EPIPE' || err.code === 'ECONNRESET') return;
                        console.error('Vite Proxy Error:', err);
                    });
                },
            },
        },
    },
});
