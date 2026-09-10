import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  name: z.string().trim().min(1).max(100).optional(),
});

export type RegisterDTO = z.infer<typeof registerSchema>;

export interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
}

export interface RegisterResult {
  user: SafeUser;
  token: string;
}
