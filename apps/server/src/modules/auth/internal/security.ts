import { env } from "@syncdocket/env/server";
import { sign, verify } from "hono/jwt";

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  exp?: number;
}

export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, { algorithm: "argon2id" });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}

export async function signAccessToken(
  payload: Omit<TokenPayload, "exp">,
  expiresInSeconds = 60 * 60 * 24, // 24 hours
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return await sign({ ...payload, exp }, env.JWT_SECRET);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const payload = await verify(token, env.JWT_SECRET, "HS256");
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}
