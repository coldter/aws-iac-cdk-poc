import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/handler.ts"],
  format: ["esm"], // ESM for Lambda
  target: "node22",
  sourcemap: true,
  minify: false,
  outDir: "dist",
  clean: true,
  external: ["@libsql/client"],
  copy: [
    {
      from: "./src/db/migrations",
      to: "./dist/db/migrations",
    },
    "package.json",
  ],
  // unbundle: true,
});
