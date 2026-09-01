import "server-only";

import { z } from "zod";

const schema = z.object({
  // General
  environment: z.enum(["development", "stage", "production"]).default("development"),
  isProductionEnvironment: z.boolean().default(false),
  logLevel: z.enum(["error", "warn", "info", "debug"]).default("info"),
  logDrainUrl: z.string().default(""),
  scheme: z.string().default("https"),
  authority: z.string().default("localhost:3000"),
  host: z.url(),
});

const envVars = {
  // General
  environment: process.env.ENVIRONMENT,
  isProductionEnvironment: process.env.ENVIRONMENT === "production",
  logLevel: process.env.LOG_LEVEL,
  logDrainUrl: process.env.LOG_DRAIN_URL,
  scheme: process.env.SCHEME,
  authority: process.env.AUTHORITY,
  host: `${process.env.SCHEME || "https"}://${process.env.AUTHORITY || "localhost:3000"}`,
};

const conf = schema.parse(envVars);

export default conf;
