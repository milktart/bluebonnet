import * as server from '../entries/pages/dashboard/_page.server.ts.js';

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/dashboard/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/dashboard/+page.server.ts";
export const imports = ["_app/immutable/nodes/4.D3mMd4G2.js","_app/immutable/chunks/mgpANiac.js","_app/immutable/chunks/6VQ_8qfV.js","_app/immutable/chunks/C0UKtQpt.js","_app/immutable/chunks/CIvPegGI.js","_app/immutable/chunks/BgKsp-fi.js","_app/immutable/chunks/DWD46BZK.js","_app/immutable/chunks/CTlAKUO8.js","_app/immutable/chunks/f1u1YO7c.js","_app/immutable/chunks/BjBIcaOF.js","_app/immutable/chunks/Djbzun47.js","_app/immutable/chunks/CUWQK3vX.js","_app/immutable/chunks/Q5xtHlis.js","_app/immutable/chunks/D4j-cL-r.js","_app/immutable/chunks/y2GqnK4-.js","_app/immutable/chunks/DmHwEJJf.js","_app/immutable/chunks/dsJstiAQ.js"];
export const stylesheets = ["_app/immutable/assets/Button.zPaaOB86.css","_app/immutable/assets/MapLayout.DUfXPC8J.css","_app/immutable/assets/4.Dyr7Fbpb.css"];
export const fonts = [];
