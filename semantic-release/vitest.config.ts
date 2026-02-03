// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from "vitest/config";

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  test: {
    alias: {
      "~/": new URL("src/", import.meta.url).pathname,
    },
    coverage: {
      exclude: ["test/**", "vitest.config.ts"],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["lcov", "html", "text"],
      reportsDirectory: "reports/coverage",
    },
    include: ["test/**/*.test.ts", "src/**/*.test.ts"],
  },
});
