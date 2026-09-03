declare global {
	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV: 'development' | 'production' | 'test';
			PORT?: string;
			HOST?: string;
			CLIENT_URL?: string;
			LOG_LEVEL?: string;
			JWT_SECRET?: string;
			JWT_EXPIRES_IN?: string;
		}
	}
	namespace Express {
		interface Request {
			user?: {
				id: string | any;
				role: 'Admin' | 'Moderator';
			};
		}
	}
}
export {};

declare module '@/app/*';
declare module '@/config/*';
declare module '@/controllers/*';
declare module '@/middlewares/*';
declare module '@/models/*';
declare module '@/routes/*';
declare module '@/services/*';
declare module '@/utils/*';
declare module '@/types/*';
