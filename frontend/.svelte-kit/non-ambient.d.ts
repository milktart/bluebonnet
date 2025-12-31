
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/api" | "/api/v1" | "/api/v1/car-rentals" | "/api/v1/car-rentals/[id]" | "/api/v1/events" | "/api/v1/events/[id]" | "/api/v1/flights" | "/api/v1/flights/[id]" | "/api/v1/hotels" | "/api/v1/hotels/[id]" | "/api/v1/transportation" | "/api/v1/transportation/[id]" | "/dashboard" | "/dashboard/components" | "/login" | "/logout" | "/register";
		RouteParams(): {
			"/api/v1/car-rentals/[id]": { id: string };
			"/api/v1/events/[id]": { id: string };
			"/api/v1/flights/[id]": { id: string };
			"/api/v1/hotels/[id]": { id: string };
			"/api/v1/transportation/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string };
			"/api": { id?: string };
			"/api/v1": { id?: string };
			"/api/v1/car-rentals": { id?: string };
			"/api/v1/car-rentals/[id]": { id: string };
			"/api/v1/events": { id?: string };
			"/api/v1/events/[id]": { id: string };
			"/api/v1/flights": { id?: string };
			"/api/v1/flights/[id]": { id: string };
			"/api/v1/hotels": { id?: string };
			"/api/v1/hotels/[id]": { id: string };
			"/api/v1/transportation": { id?: string };
			"/api/v1/transportation/[id]": { id: string };
			"/dashboard": Record<string, never>;
			"/dashboard/components": Record<string, never>;
			"/login": Record<string, never>;
			"/logout": Record<string, never>;
			"/register": Record<string, never>
		};
		Pathname(): "/" | "/api" | "/api/" | "/api/v1" | "/api/v1/" | "/api/v1/car-rentals" | "/api/v1/car-rentals/" | `/api/v1/car-rentals/${string}` & {} | `/api/v1/car-rentals/${string}/` & {} | "/api/v1/events" | "/api/v1/events/" | `/api/v1/events/${string}` & {} | `/api/v1/events/${string}/` & {} | "/api/v1/flights" | "/api/v1/flights/" | `/api/v1/flights/${string}` & {} | `/api/v1/flights/${string}/` & {} | "/api/v1/hotels" | "/api/v1/hotels/" | `/api/v1/hotels/${string}` & {} | `/api/v1/hotels/${string}/` & {} | "/api/v1/transportation" | "/api/v1/transportation/" | `/api/v1/transportation/${string}` & {} | `/api/v1/transportation/${string}/` & {} | "/dashboard" | "/dashboard/" | "/dashboard/components" | "/dashboard/components/" | "/login" | "/login/" | "/logout" | "/logout/" | "/register" | "/register/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}