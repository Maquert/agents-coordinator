/**
 * @fileoverview Registers the Sidecar SDK ESM resolver.
 *
 * Passed via `--import` on startup. Kept separate from `esm_resolver.js`
 * to avoid infinite loops during worker thread registration.
 */

import { register } from 'node:module';
register(new URL('./esm_resolver.js', import.meta.url));
