import * as server from '../entries/pages/dashboard/_layout.server.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/layout.svelte.js')).default;
export { server };
export const server_id = "src/routes/dashboard/+layout.server.ts";
export const imports = ["_app/immutable/nodes/2.CxgLXvPu.js","_app/immutable/chunks/DEQZWcZK.js","_app/immutable/chunks/Bdm07ddG.js","_app/immutable/chunks/BScA0Vik.js","_app/immutable/chunks/CIpIYNEy.js","_app/immutable/chunks/zzEd-KAd.js"];
export const stylesheets = [];
export const fonts = [];
