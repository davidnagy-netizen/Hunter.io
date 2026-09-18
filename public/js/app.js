import { request } from "./api.js";
import { scoreBand } from "./scoring.js";

/** Public module surface for incremental migration of the legacy app shell. */
export const HunterApp = Object.freeze({ request, scoreBand });
globalThis.HunterApp = HunterApp;
