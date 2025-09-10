import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    HF_API_KEY: z.string().min(1, "Hugging Face API key is required"),
    HF_ACCOUNT_ID: z.string().min(1, "Hugging Face Account ID is required"),
    HF_GATEWAY_ID: z.string().min(1, "Hugging Face Gateway ID is required"),
    HF_MODEL_SERVER: z.string().min(1, "Hugging Face Server Model is required"),
  },
  client: {},
  // If you're using Next.js < 13.4.4, you'll need to specify the runtimeEnv manually
  runtimeEnv: {
    HF_API_KEY: process.env.HF_API_KEY,
    HF_ACCOUNT_ID: process.env.HF_ACCOUNT_ID,
    HF_GATEWAY_ID: process.env.HF_GATEWAY_ID,
    HF_MODEL_SERVER: process.env.HF_MODEL_SERVER,
  },
  // For Next.js >= 13.4.4, you only need to destructure client variables:
  // experimental__runtimeEnv: {
  //   NEXT_PUBLIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
  // }
});
