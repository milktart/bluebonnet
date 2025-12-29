import * as server from '../entries/pages/dashboard/_layout.server.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/layout.svelte.js')).default;
export { server };
export const server_id = "src/routes/dashboard/+layout.server.ts";
export const imports = ["_app/immutable/nodes/2.DUYAm1xj.js","_app/immutable/chunks/mgpANiac.js","_app/immutable/chunks/6VQ_8qfV.js","_app/immutable/chunks/CTlAKUO8.js"];
export const stylesheets = [];
export const fonts = [];
