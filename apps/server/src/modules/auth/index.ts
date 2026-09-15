import { db } from "@syncdocket/db";
import { eq } from "drizzle-orm";
import type { SafeUser } from "./features/register/register.dto";
import { type TokenPayload, verifyAccessToken } from "./internal/security";
import { users } from "./schema";

export { authManifest } from "./auth.manifest";
export * from "./events";
export type { RegisterDTO, RegisterResult, SafeUser } from "./features/register/register.dto";
export type { TokenPayload } from "./internal/security";
export { authRoutes } from "./routes";

export interface AuthContract {
  getUserById(userId: string): Promise<SafeUser | null>;
  verifyToken(token: string): Promise<TokenPayload | null>;
}

class AuthModuleService implements AuthContract {
  async getUserById(userId: string): Promise<SafeUser | null> {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user ?? null;
  }

  async verifyToken(token: string): Promise<TokenPayload | null> {
    return await verifyAccessToken(token);
  }
}

export const authModule: AuthContract = new AuthModuleService();
