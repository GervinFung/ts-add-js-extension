export * from './utils';
export * from './utils/util';
export * from '../../js/main/index.css';
export declare const dynamic = () => Promise<typeof import('./utils')>;
export type a = typeof import('./utils');
Promise<{
	default: typeof import(`./utils`);
	getHeapStatistics(): import('./utils').HeapStatistics;
}>;
