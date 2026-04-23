import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';
import booksRouter from './routes/books.js';
import versionsRouter from './routes/versions.js';
import assetsRouter from './routes/assets.js';
import aiRouter from './routes/ai.js';
import agentsRouter from './routes/agents.js';
import providersRouter from './routes/providers.js';
import mcpRouter from './routes/mcp.js';
import projectsRouter from './routes/projects.js';
import { providerManager } from './services/ai/providerManager.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(join(__dirname, '../uploads')));

app.use('/api/books', booksRouter);
app.use('/api/books', versionsRouter);
app.use('/api/books', assetsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/providers', providersRouter);
app.use('/api/mcp', mcpRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

async function startServer() {
  await providerManager.initialize();
  console.log('AI providers initialized');

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);

export default app;
