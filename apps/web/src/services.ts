import { createDb } from "@eddie-at-bangmod/db";
import type { Database } from "@eddie-at-bangmod/db";

import { ENV } from "./env.server";

export const getDb = (): Database => createDb(ENV);
