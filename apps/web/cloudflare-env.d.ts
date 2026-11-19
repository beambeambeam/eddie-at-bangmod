import type { WebEnv as ServerEnv } from "@eddie-at-bangmod/infra/alchemy.run";

// This file infers types for the cloudflare:workers environment from your Alchemy Worker.
// @see https://alchemy.run/cloudflare/compute/workers

export type CloudflareEnv = ServerEnv;

declare global {
  type Env = CloudflareEnv;
}

declare module "cloudflare:workers" {
  namespace Cloudflare {
    // Declaration merging requires an interface.
    // oxlint-disable-next-line typescript/no-empty-object-type, typescript/no-empty-interface
    export interface Env extends CloudflareEnv {}
  }
}
