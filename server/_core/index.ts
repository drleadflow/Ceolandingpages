import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { logger } from "./logger";
import { handleWhopWebhook } from "../whopWebhook";
import { seedProducts } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Whop webhook route
  app.post("/api/whop-webhook", express.json(), handleWhopWebhook);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Request logging
  app.use((req, _res, next) => {
    if (req.path !== "/api/health") {
      logger.debug({ method: req.method, path: req.path }, "incoming request");
    }
    next();
  });
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  // Early lead capture - minimal data push to GHL
  app.post('/api/early-lead', async (req, res) => {
    try {
      const { firstName, email } = req.body;

      if (!firstName || !email) {
        return res.status(400).json({ error: 'firstName and email are required' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
      }

      // Fire to GHL async (don't block response)
      const ghlUrl = process.env.GHL_WEBHOOK_URL;
      if (ghlUrl) {
        fetch(ghlUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: firstName,
            email: email,
            tags: 'landing-page-lead,early-capture',
            source: 'Landing Page Early Capture',
          }),
        }).catch(err => console.error('Early lead GHL push failed:', err));
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Early lead capture failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Video heatmap beacon endpoint (sendBeacon sends raw JSON, not tRPC format)
  app.post('/api/video-heatmap/track', async (req, res) => {
    try {
      const { getDb } = await import('../db');
      const { videoHeatmapViews } = await import('../../drizzle/schema');
      const db = await getDb();
      if (!db) return res.status(503).json({ error: 'DB unavailable' });

      const b = req.body;
      if (!b?.sessionId || !b?.videoId || !b?.pageSlug) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await db.insert(videoHeatmapViews).values({
        sessionId: String(b.sessionId),
        videoId: String(b.videoId),
        pageSlug: String(b.pageSlug),
        playbackVector: JSON.stringify(b.playbackVector ?? []),
        seekEvents: JSON.stringify(b.seekEvents ?? []),
        maxSecondReached: Number(b.maxSecondReached) || 0,
        totalWatchTimeSec: Number(b.totalWatchTimeSec) || 0,
        videoDurationSec: Number(b.videoDurationSec) || 0,
        deviceType: b.deviceType ? String(b.deviceType) : null,
      });

      res.json({ success: true });
    } catch (error) {
      logger.error({ err: error }, 'Video heatmap track failed');
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err, path: _req.path, method: _req.method }, "Unhandled server error");
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    logger.info({ preferredPort, port }, "Preferred port busy, using alternative");
  }

  server.listen(port, () => {
    logger.info({ port }, "Server running");
    // Seed funnel products (no-op if already seeded)
    seedProducts().catch(err => logger.warn({ err }, "Product seeding skipped"));
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info({ signal }, "Shutting down gracefully");
    server.close(() => {
      logger.info("Server closed");
      process.exit(0);
    });
    // Force exit after 10s if connections won't close
    setTimeout(() => process.exit(1), 10_000);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch((err) => { logger.fatal({ err }, "Server failed to start"); process.exit(1); });
