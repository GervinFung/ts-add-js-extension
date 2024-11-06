export * from './utils/index.js';
export * from './utils/util.mjs';
export declare const dynamic = () => Promise<typeof import('./utils/index.js')>;
export type a = typeof import(`./utils/index.js`);
Promise<{
	default: typeof import(`./utils/index.js`);
	getHeapStatistics(): import('./utils/index.js').HeapStatistics;
}>;
