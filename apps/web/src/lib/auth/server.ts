import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { createDatabase } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";

const { db } = createDatabase();

export const auth = betterAuth({
  appName: process.env.NEXT_PUBLIC_PRODUCT_NAME ?? "雅思提分系统",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "student",
        input: false,
      },
      termsAcceptedAt: {
        type: "date",
        required: true,
        input: true,
        returned: false,
      },
    },
  },
});
