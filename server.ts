import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './src/server/db';
import { apiRouter } from './src/server/routes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB tables and seed data
  try {
    await initDatabase();
  } catch (err) {
    console.error('Database failed to initialize:', err);
  }

  // Middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(cors());

  // Mount API endpoints
  app.use('/api', apiRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
  });

  // Serve static assets/Vite middleware depending on environment
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted in development mode');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production static build from:', distPath);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampusEvent AI Fullstack Server running on http://localhost:${PORT}`);
  });
}

startServer();
