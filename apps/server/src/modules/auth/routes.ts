import { Hono } from "hono";
import { ApiResponse } from "@/utils/api-response";
import { registerSchema } from "./features/register/register.dto";
import { registerHandler } from "./features/register/register.handler";

export const authRoutes = new Hono();

authRoutes.post("/register", async (c) => {
  const body = await c.req.json().catch(() => null);

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      ApiResponse.badRequest("Validation failed", parsed.error.flatten().fieldErrors),
      400,
    );
  }

  const result = await registerHandler(parsed.data);
  return c.json(ApiResponse.created(result, "User registered successfully"), 201);
});
