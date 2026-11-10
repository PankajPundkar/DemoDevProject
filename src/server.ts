import { config } from './config';
import { createApp } from './app';
import { sessionStore } from './middleware/session';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`[server] ${config.siteName} running at http://localhost:${config.port} (${config.env})`);
  if (!config.cookieSecure && config.isProduction) {
    console.warn('[server] COOKIE_SECURE is false in production - cookies will be sent over plain HTTP.');
  }
});

function shutdown(signal: string): void {
  console.log(`[server] ${signal} received, shutting down...`);
  sessionStore.close();
  server.close(() => process.exit(0));
  // Force exit if connections don't close in time.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
