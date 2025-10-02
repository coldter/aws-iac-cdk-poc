import type { LambdaEvent } from "hono/aws-lambda";

/**
 * Set node server bindings.
 *
 * @link https://hono.dev/docs/getting-started/nodejs#access-the-raw-node-js-apis
 */
type Bindings = {
  event: LambdaEvent;
};

/**
 * Define the context environment.
 *
 * @link https://hono.dev/docs/middleware/builtin/context-storage#usage
 */
export type Env = {
  // Variables: {};
  Bindings: Bindings;
};
