import * as server from '../entries/pages/dashboard/_page.server.ts.js';

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/dashboard/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/dashboard/+page.server.ts";
export const imports = ["_app/immutable/nodes/4.Ckn-7v0o.js","_app/immutable/chunks/DEQZWcZK.js","_app/immutable/chunks/Bdm07ddG.js","_app/immutable/chunks/DbP9mNSK.js","_app/immutable/chunks/CCdMYgeh.js","_app/immutable/chunks/CYXCxvtB.js","_app/immutable/chunks/BUekOoY4.js","_app/immutable/chunks/zzEd-KAd.js","_app/immutable/chunks/BScA0Vik.js","_app/immutable/chunks/CIpIYNEy.js","_app/immutable/chunks/BaREphif.js","_app/immutable/chunks/BbjKg58C.js","_app/immutable/chunks/B-xIifH9.js","_app/immutable/chunks/DHK5oNFW.js","_app/immutable/chunks/DmkykLks.js","_app/immutable/chunks/BNuoJWSh.js","_app/immutable/chunks/5NjxD39n.js","_app/immutable/chunks/CYocR22o.js","_app/immutable/chunks/D9-TEBsA.js","_app/immutable/chunks/BwzTCSzj.js","_app/immutable/chunks/C2hxIDHj.js"];
export const stylesheets = ["_app/immutable/assets/Button.zPaaOB86.css","_app/immutable/assets/MapLayout.fKV0Ueur.css","_app/immutable/assets/4.Dyr7Fbpb.css"];
export const fonts = [];
