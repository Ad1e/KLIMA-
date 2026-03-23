/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_OPEN_METEO_FORECAST_API_URL?: string;
	readonly VITE_OPEN_METEO_TIMEZONE?: string;
	readonly VITE_GDACS_TYHOON_EVENTS_API_URL?: string;
	readonly VITE_PAGASA_CYCLONE_DAT_URL?: string;
	readonly VITE_BACKEND_API_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare module '*.png' {
	const src: string;
	export default src;
}
