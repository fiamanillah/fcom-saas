import { env } from "@syncdocket/env/server";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";

import * as schema from "./schema/index";

export const db: NodePgDatabase<typeof schema> = drizzle(env.DATABASE_URL, { schema });
