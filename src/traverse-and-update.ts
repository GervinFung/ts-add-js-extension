import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import type { SourceFile, Files } from './read-write';
import { extensionsUtil, separator } from './const';
import { asString } from './type';

const formProperFilePath = ({
	filePath,
}: Readonly<{
	filePath: string;
}>) => {
	return filePath.split(separator).filter(Boolean).join(separator);
};

const checkJavaScriptFileExistByAppend = ({
	filePath,
}: Readonly<{
	filePath: string;
}>) => {
	const { js, mjs } = extensionsUtil().extensions.javaScript;

	const jsFilePath = `${filePath}${js}`;

	if (fs.existsSync(jsFilePath)) {
		return { extension: js, filePath: jsFilePath };
	}

	const mjsFilePath = `${filePath}${mjs}`;

	if (fs.existsSync(mjsFilePath)) {
		return { extension: mjs, filePath: mjsFilePath };
	}
	return false;
};

const checkTypeDefinitionFileExistByAppend = ({
	filePath,
}: Readonly<{
	filePath: string;
}>) => {
	const { extensions } = extensionsUtil();
	const { js, mjs } = extensions.javaScript;
	const { dts, dmts } = extensions.typeDefinition;

	const dtsFilePath = `${filePath}${dts}`;

	if (fs.existsSync(dtsFilePath)) {
		return { extension: js, filePath: dtsFilePath };
	}

	const dmtsFileapath = `${filePath}${dmts}`;
	if (fs.existsSync(dmtsFileapath)) {
		return { extension: mjs, filePath: dmtsFileapath };
	}
	return false;
};

const isDirectory = (filePath: string) => {
	try {
		return fs.lstatSync(filePath).isDirectory();
	} catch (error) {
		return false;
	}
};

const addJSExtensionConditionally = ({
	filePath,
	importPath,
	checkType,
}: Readonly<{
	filePath: string;
	importPath: string;
	checkType: 'dts' | 'js';
}>) => {
	const check =
		checkType === 'js'
			? checkJavaScriptFileExistByAppend
			: checkTypeDefinitionFileExistByAppend;

	const skip = {
		procedure: 'skip',
	} as const;

	if (!isDirectory(filePath)) {
		const extensionResult = check({
			filePath,
		});

		if (!extensionResult) {
			return skip;
		}

		return {
			procedure: 'proceed',
			absolutePath: extensionResult.filePath,
			importPath: formProperFilePath({
				filePath: `${importPath}${extensionResult.extension}`,
			}),
		} as const;
	}

	const extensionResult = check({
		filePath: path.posix.join(filePath, 'index'),
	});

	if (!extensionResult) {
		return skip;
	}

	const file = `index${extensionResult.extension}`;

	return {
		procedure: 'proceed',
		absolutePath: extensionResult.filePath,
		importPath: formProperFilePath({
			filePath: [importPath, separator, file].join(''),
		}),
	} as const;
};

const addJSExtension = ({
	filePath,
	importPath,
}: Readonly<{
	filePath: string;
	importPath: string;
}>): ReturnType<typeof addJSExtensionConditionally> => {
	if (extensionsUtil().matchAnyJs(filePath)) {
		return {
			procedure: 'skip',
		};
	}

	const result = addJSExtensionConditionally({
		filePath,
		importPath,
		checkType: 'js',
	});

	if (result.procedure === 'proceed') {
		return result;
	}

	return addJSExtensionConditionally({
		filePath,
		importPath,
		checkType: 'dts',
	});
};

const traverseAndUpdateFileWithJSExtension = (files: Files) => {
	return (sourceFile: SourceFile) => {
		const charactersDelimiter = '';
		const code = sourceFile.getText();
		const characters = code.split(charactersDelimiter);

		const replaceNodes = sourceFile.statements.flatMap((statement) => {
			switch (statement.kind) {
				case ts.SyntaxKind.ImportDeclaration:
				case ts.SyntaxKind.ExportDeclaration: {
					const imExDeclaration = statement as
						| ts.ExportDeclaration
						| ts.ImportDeclaration;

					if (!imExDeclaration.moduleSpecifier) {
						return [];
					}

					const moduleSpecifier = asString({
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						value: imExDeclaration.moduleSpecifier.text,
						error: new Error(
							'Module specifier of node should have text'
						),
					});

					const fileName = formProperFilePath({
						filePath: !moduleSpecifier.endsWith(separator)
							? moduleSpecifier
							: moduleSpecifier.slice(0, -1),
					})
						.split(separator)
						.pop();

					if (!fileName) {
						throw new Error(
							`Impossible for file name to be non-existent for ${moduleSpecifier}`
						);
					}

					if (moduleSpecifier.startsWith('.')) {
						const result = addJSExtension({
							importPath: moduleSpecifier,
							filePath: path.posix.join(
								sourceFile.fileName,
								'..',
								moduleSpecifier
							),
						});

						switch (result.procedure) {
							case 'proceed': {
								// if file name not included in list of js file read

								if (
									files.find((file) => {
										return file.endsWith(
											result.absolutePath
										);
									})
								) {
									const before = characters
										.filter((_, index) => {
											return (
												index > imExDeclaration.pos &&
												index < imExDeclaration.end
											);
										})
										.join(charactersDelimiter);

									return [
										{
											before,
											after: before.replace(
												moduleSpecifier,
												result.importPath
											),
										},
									];
								}
							}
						}
					}
				}
			}
			return [];
		});

		return !replaceNodes.length
			? []
			: [
					{
						file: sourceFile.fileName,
						code: replaceNodes.reduce((prev, { before, after }) => {
							return prev.replace(before, after);
						}, code),
					},
			  ];
	};
};

export default traverseAndUpdateFileWithJSExtension;
