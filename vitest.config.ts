import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/lib/**/*.ts"],
      exclude: [
        // Infrastructure — require live DB, external APIs, or NextAuth
        "src/lib/db/**",
        "src/lib/hooks/**",
        "src/lib/supabase/**",
        "src/lib/email/**",
        "src/lib/queries/**",
        "src/lib/auth.ts",
        "src/lib/social-embed.ts",
        "src/lib/rate-limit.ts",
        // Pure UI config — no logic to test
        "src/lib/animation-variants.ts",
        "src/lib/ui-config.ts",
        // Complex actions — Google Places API + heavy DB interactions
        "src/lib/actions/venues.ts",
        "src/lib/actions/members.ts",
        "src/lib/actions/date-votes.ts",
        "src/lib/actions/profile.ts",
        "src/lib/actions/activity.ts",
        "src/lib/actions/social-embed-metadata.ts",
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
});
