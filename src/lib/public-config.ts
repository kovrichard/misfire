import "server-only";
import { z } from "zod";

const schema = z.object({
  // Tracking
  gaId: z.string().optional(),
  gtmId: z.string().optional(),
  googleAdsId: z.string().optional(),
  clarityId: z.string().optional(),
});

const envVars = {
  // Tracking
  gaId: process.env.GOOGLE_ANALYTICS_ID,
  gtmId: process.env.GOOGLE_TAG_MANAGER_ID,
  googleAdsId: process.env.GOOGLE_ADS_ID,
  clarityId: process.env.CLARITY_ID,
};

export type PublicConfig = z.infer<typeof schema>;

const publicConf: PublicConfig = schema.parse(envVars);

export default publicConf;
