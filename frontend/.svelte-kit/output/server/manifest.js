export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.DSvtpibH.js",app:"_app/immutable/entry/app.CO0Sisk6.js",imports:["_app/immutable/entry/start.DSvtpibH.js","_app/immutable/chunks/C8awTV7T.js","_app/immutable/chunks/Bdm07ddG.js","_app/immutable/chunks/DmkykLks.js","_app/immutable/entry/app.CO0Sisk6.js","_app/immutable/chunks/D9-TEBsA.js","_app/immutable/chunks/Bdm07ddG.js","_app/immutable/chunks/CYXCxvtB.js","_app/immutable/chunks/DEQZWcZK.js","_app/immutable/chunks/CCdMYgeh.js","_app/immutable/chunks/BwzTCSzj.js","_app/immutable/chunks/BUekOoY4.js","_app/immutable/chunks/zzEd-KAd.js","_app/immutable/chunks/BScA0Vik.js","_app/immutable/chunks/CIpIYNEy.js","_app/immutable/chunks/DHK5oNFW.js","_app/immutable/chunks/DmkykLks.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/api/v1/car-rentals/[id]",
				pattern: /^\/api\/v1\/car-rentals\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/car-rentals/_id_/_server.ts.js'))
			},
			{
				id: "/api/v1/events/[id]",
				pattern: /^\/api\/v1\/events\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/events/_id_/_server.ts.js'))
			},
			{
				id: "/api/v1/flights/[id]",
				pattern: /^\/api\/v1\/flights\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/flights/_id_/_server.ts.js'))
			},
			{
				id: "/api/v1/hotels/[id]",
				pattern: /^\/api\/v1\/hotels\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/hotels/_id_/_server.ts.js'))
			},
			{
				id: "/api/v1/transportation/[id]",
				pattern: /^\/api\/v1\/transportation\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/transportation/_id_/_server.ts.js'))
			},
			{
				id: "/dashboard",
				pattern: /^\/dashboard\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/logout",
				pattern: /^\/logout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/logout/_server.ts.js'))
			},
			{
				id: "/register",
				pattern: /^\/register\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
