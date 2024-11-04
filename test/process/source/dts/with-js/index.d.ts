export * from './utils';
export * from './utils/util';
export * from './components';
export * from './components/component';
export declare const dynamic = () => Promise<typeof import('./utils')>;
export declare const dynamic1 = () =>
	Promise<typeof import(`./utils`).qualifier>;
