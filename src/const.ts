const extensionsUtil = () => {
	const extensions = {
		js: '.js',
		mjs: '.mjs',
		dts: '.d.ts',
	} as const;

	const arrayfyExtensions = Object.values(extensions);

	return {
		extensions,
		matchAnyJs: (filePath: string) => {
			return Boolean(
				arrayfyExtensions
					.filter((extension) => {
						return extension !== '.d.ts';
					})
					.find((extension) => {
						return filePath.endsWith(extension);
					})
			);
		},
		matchAny: (filePath: string) => {
			return Boolean(
				arrayfyExtensions.find((extension) => {
					return filePath.endsWith(extension);
				})
			);
		},
	} as const;
};

const separator = '/';

export { extensionsUtil, separator };
