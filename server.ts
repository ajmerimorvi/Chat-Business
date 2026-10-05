import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Serving static assets from the dist directory
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Cloud Run and Google Cloud load balancer health check endpoints
app.get(['/_healthz', '/healthz', '/api/health'], (_req, res) => {
  res.status(200).json({ status: 'ok', app: 'Sampark', timestamp: Date.now() });
});

// Dedicated APK download endpoint with Android Package MIME headers
app.get('/Sampark.apk', (_req, res) => {
  const apkPath = path.join(distPath, 'Sampark.apk');
  if (fs.existsSync(apkPath)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="Sampark.apk"');
    res.sendFile(apkPath);
  } else {
    res.status(404).send('APK building, please refresh in a moment.');
  }
});

// For any other request, send back index.html for SPA client-side routing
app.get('*', (_req, res) => {
  const indexHtml = path.join(distPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(200).send(`<!doctype html><html><head><title>Sampark</title></head><body><div id="root">Loading Sampark...</div></body></html>`);
  }
});

// Global error handling middleware so Express never crashes on unexpected requests
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(200).send('OK');
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server successfully listening on 0.0.0.0:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully');
  server.close(() => {
    process.exit(0);
  });
});

