import { env } from "@syncdocket/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createChildLogger } from "./lib/logger";

const app = new Hono();

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

export default app;
