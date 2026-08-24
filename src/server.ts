/**
 * src/server.ts
 *
 * Local development entry point.
 *
 * This file is ONLY used when running locally with `npm run dev` or `npm start`.
 * Vercel does NOT use this file — it imports app.ts directly.
 *
 * Handles graceful shutdown on SIGTERM/SIGINT.
 */

import app from './app';
import { env } from './config/env';

const server = app.listen(env.port, () => {
  console.log(`
┌─────────────────────────────────────────────┐
│                                             │
│   🚀  3D Blog Backend API                   │
│                                             │
│   Environment : ${env.nodeEnv.padEnd(26)} │
│   Port        : ${String(env.port).padEnd(26)} │
│   API Base    : http://localhost:${String(env.port)}/api   │
│   Swagger UI  : http://localhost:${String(env.port)}/api/docs │
│   Health      : http://localhost:${String(env.port)}/api/health │
│                                             │
└─────────────────────────────────────────────┘
  `);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

function shutdown(signal: string): void {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);

  server.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });

  // Force exit after 10 seconds if connections hang
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Unhandled Errors ─────────────────────────────────────────────────────────

process.on('unhandledRejection', (reason: unknown) => {
  console.error('[Server] Unhandled Promise Rejection:', reason);
  // In production, let the process manager restart
  if (env.nodeEnv === 'production') {
    shutdown('unhandledRejection');
  }
});

process.on('uncaughtException', (error: Error) => {
  console.error('[Server] Uncaught Exception:', error.message);
  shutdown('uncaughtException');
});

export default server;
