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
        "src/lib/rate-limit.ts",
        // Test utilities — not production code
        "src/lib/__test-utils__/**",
        // Pure constants — no logic to test
        "src/lib/motion-variants.ts",
        "src/lib/ui-config.ts",
        // Integration-test-only — too many sequential DB calls for mock-based unit tests
        "src/lib/actions/venues.ts",
      ],
      thresholds: {
        lines: 85,
        functions: 80,
        branches: 80,
        statements: 85,
      },
    },
  },
});
