const separator = '/';

const extensions = {
	javaScript: ['.js', '.mjs', '.jsx'],
	typeDefinition: ['.d.ts', '.d.mts'],
} as const;

const matchJs = (filePath: string) => {
	return extensions.javaScript.find((extension) => {
		return filePath.endsWith(extension);
	});
};

const matchDts = (filePath: string) => {
	return extensions.typeDefinition.find((extension) => {
		return filePath.endsWith(extension);
	});
};

const matchEither = (filePath: string) => {
	return matchJs(filePath) ?? matchDts(filePath);
};

export { extensions, matchJs, matchDts, matchEither, separator };
