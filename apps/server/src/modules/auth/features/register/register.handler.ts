import { db } from "@syncdocket/db";
import { eq } from "drizzle-orm";
import { ApiError } from "@/utils/api-response";
import { hashPassword, signAccessToken } from "../../internal/security";
import { authOutboxEvents, users } from "../../schema";
import type { RegisterDTO, RegisterResult } from "./register.dto";

export async function registerHandler(dto: RegisterDTO): Promise<RegisterResult> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, dto.email))
    .limit(1);

  if (existing) {
    throw new ApiError(409, "A user with this email address already exists");
  }

  const passwordHash = await hashPassword(dto.password);

  const user = await db.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(users)
      .values({
        email: dto.email,
        passwordHash,
        name: dto.name || null,
        role: "user",
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      });

    if (!newUser) {
      throw new ApiError(500, "Failed to create user record");
    }

    await tx.insert(authOutboxEvents).values({
      eventType: "auth.user.registered",
      payload: {
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    });

    return newUser;
  });

  const token = await signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user,
    token,
  };
}
