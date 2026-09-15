import { env } from "@syncdocket/env/server";
import { createChildLogger } from "@syncdocket/infra/logger";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { closeQueues } from "./lib/queue";
import { closeSentry, initSentry } from "./lib/sentry";
import { closeWorkers, startWorkers } from "./lib/workers";
import { authManifest, authRoutes } from "./modules/auth";
import { errorHandler } from "./utils/error-handler";

initSentry();

const app = new Hono();

app.onError(errorHandler);

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

app.get("/", (c) => {
  createChildLogger({ route: "/", method: "GET" }).info("Root endpoint accessed");
  return c.text("OK");
});

// API v1
const v1 = new Hono();
v1.route(authManifest.basePath, authRoutes);

// Mount versioned API & backwards-compatible aliases
app.route("/api/v1", v1);
app.route(authManifest.basePath, authRoutes);

// Start background workers outside test environments
if (env.NODE_ENV !== "test") {
  startWorkers();

  const shutdown = async (signal: string) => {
    createChildLogger({ service: "server" }).info(`Received ${signal}, shutting down...`);
    await closeWorkers();
    await closeQueues();
    await closeSentry();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

export default app;
