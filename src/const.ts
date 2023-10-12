class ExtensionsUtil {
	static readonly extensions = {
		javaScript: {
			js: '.js',
			mjs: '.mjs',
		},
		typeDefinition: {
			dts: '.d.ts',
			dmts: '.d.mts',
		},
	} as const;

	static readonly matchJs = (filePath: string) => {
		const { js, mjs } = this.extensions.javaScript;

		return filePath.endsWith(js) || filePath.endsWith(mjs);
	};

	static readonly matchDts = (filePath: string) => {
		const { dts, dmts } = this.extensions.typeDefinition;

		return filePath.endsWith(dts) || filePath.endsWith(dmts);
	};

	static readonly matchEither = (filePath: string) => {
		return this.matchJs(filePath) || this.matchDts(filePath);
	};
}

const separator = '/';

export { ExtensionsUtil, separator };
