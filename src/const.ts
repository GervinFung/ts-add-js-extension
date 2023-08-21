const extensionsUtil = () => {
	const extensions = {
		javaScript: {
			js: '.js',
			mjs: '.mjs',
		},
		typeDefinition: {
			dts: '.d.ts',
			dmts: '.d.mts',
		},
	} as const;

	const arrayfyExtensions = Object.values(extensions).flatMap((value) => {
		return Object.values(value);
	});

	return {
		extensions,
		matchAnyJs: (filePath: string) => {
			return Boolean(
				arrayfyExtensions
					.filter((extension) => {
						return extension !== '.d.ts' && extension !== '.d.mts';
					})
					.find((extension) => {
						return filePath.endsWith(extension);
					})
			);
		},
		matchAnyDts: (filePath: string) => {
			return Boolean(
				arrayfyExtensions
					.filter((extension) => {
						return extension !== '.d.ts' && extension !== '.d.mts';
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
