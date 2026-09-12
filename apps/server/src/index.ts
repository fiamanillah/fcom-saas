import { env } from "@syncdocket/env/server";
import { createChildLogger } from "@syncdocket/infra/logger";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authManifest, authRoutes } from "./modules/auth";
import { errorHandler } from "./utils/error-handler";

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

export default app;
