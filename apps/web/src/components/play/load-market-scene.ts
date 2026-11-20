/**
 * Fetches the Market scene and Three.js. The home page calls it while idle,
 * so `/play` usually finds the chunk already loaded. The browser caches the
 * module, so calling it again costs nothing.
 */
export const loadMarketScene = async () => await import("./market-scene");
