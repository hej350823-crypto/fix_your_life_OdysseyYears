import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import geminiHandler from './api/gemini.js';

const runNetworkFix = async () => {
  try {
    await import('./scripts/fix-network.mjs');
  } catch (error) {
    console.warn('[local-api] Network fix skipped.', error);
  }
};

const localApiPlugin = (): Plugin => ({
  name: 'local-api',
  configureServer(server) {
    void runNetworkFix();
    server.middlewares.use('/api/gemini', async (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }

      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      req.on('end', async () => {
        try {
          (req as typeof req & { body?: string }).body = Buffer.concat(chunks).toString('utf8');
          await geminiHandler(req, res);
        } catch (error) {
          console.error('Local API middleware failed', error);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
          }
          res.end(JSON.stringify({ error: 'Local API middleware failed' }));
        }
      });
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
  server: {
    port: 3000,
    host: '127.0.0.1',
  },
  plugins: [localApiPlugin(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  };
});
