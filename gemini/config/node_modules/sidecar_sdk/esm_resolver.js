/**
 * @fileoverview Custom ESM resolver for the Sidecar SDK.
 *
 * Resolves 'sidecar_sdk' imports to the centralized SDK location.
 * Required because Node.js ESM does not support `NODE_PATH` for bare specifiers,
 * allowing sidecars to import the SDK without local `node_modules`.
 */
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'sidecar_sdk') {
    return {
      shortCircuit: true,
      url: new URL('./index.mjs', import.meta.url).href
    };
  }
  return nextResolve(specifier, context);
}
