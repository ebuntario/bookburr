import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://build:build@localhost:5432/build";

const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });
