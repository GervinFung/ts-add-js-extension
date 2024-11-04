export * from '../main';
export const fn = () => {
	import(`../main`).then(({ qualifier }) => {
		return qualifier;
	});
	return import('../main');
};
