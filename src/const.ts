class ExtensionsUtil {
	static readonly extensions = {
		javaScript: {
			js: '.js',
		},
		typeDefinition: {
			dts: '.d.ts',
		},
	} as const;

	static readonly matchJs = (filePath: string) => {
		const { js } = this.extensions.javaScript;

		return filePath.endsWith(js);
	};

	static readonly matchDts = (filePath: string) => {
		const { dts } = this.extensions.typeDefinition;

		return filePath.endsWith(dts);
	};

	static readonly matchEither = (filePath: string) => {
		return this.matchJs(filePath) || this.matchDts(filePath);
	};
}

const separator = '/';

export { ExtensionsUtil, separator };
