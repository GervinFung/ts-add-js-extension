class ExtensionsUtil {
	static readonly extensions = {
		javaScript: ['.js', '.mjs', '.jsx'],
		typeDefinition: ['.d.ts', '.d.mts'],
	} as const;

	static readonly matchJs = (filePath: string) => {
		return this.extensions.javaScript.find((extension) => {
			return filePath.endsWith(extension);
		});
	};

	static readonly matchDts = (filePath: string) => {
		return this.extensions.typeDefinition.find((extension) => {
			return filePath.endsWith(extension);
		});
	};

	static readonly matchEither = (filePath: string) => {
		return this.matchJs(filePath) || this.matchDts(filePath);
	};
}

const separator = '/';

export { ExtensionsUtil, separator };
