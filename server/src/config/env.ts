import dotenv from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

dotenv.config({ path: resolve(__dirname, "../../../.env") });

const envSchema = z.object({
  MONGODB_URI: z.string().refine(
    (value) => value.startsWith("mongodb://") || value.startsWith("mongodb+srv://"),
    "MONGODB_URI must be a MongoDB connection string.",
  ),
  MONGODB_DATABASE: z.string().min(1).default("wedding_rsvp"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must contain at least 32 characters."),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(604800),
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = parsed.data;
