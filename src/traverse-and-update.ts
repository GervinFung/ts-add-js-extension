import type { SourceFile, Files } from './read-write';

import fs from 'fs';
import path from 'path';

import ts from 'typescript';

import { extensions, matchJs, separator } from './const';
import { asString } from './type';

const formProperFilePath = (
	props: Readonly<{
		filePath: string;
	}>
) => {
	return props.filePath.split(separator).filter(Boolean).join(separator);
};

const checkJavaScriptFileExistByAppend = (
	props: Readonly<{
		filePath: string;
	}>
) => {
	const result = extensions.javaScript
		.map((extension) => {
			return {
				extension,
				filePath: `${props.filePath}${extension}`,
			};
		})
		.find((filePath) => {
			return fs.existsSync(filePath.filePath);
		});

	return result ?? false;
};

const checkTypeDefinitionFileExistByAppend = (
	props: Parameters<typeof checkJavaScriptFileExistByAppend>[0]
) => {
	const [js, mjs] = extensions.javaScript;
	const [dts, mdts] = extensions.typeDefinition;

	const dtsFilePath = `${props.filePath}${dts}`;

	if (fs.existsSync(dtsFilePath)) {
		return { extension: js, filePath: dtsFilePath };
	}

	const mdtsFilePath = `${props.filePath}${mdts}`;

	if (fs.existsSync(mdtsFilePath)) {
		return { extension: mjs, filePath: mdtsFilePath };
	}

	return false;
};

const isDirectory = (filePath: string) => {
	try {
		return fs.lstatSync(filePath).isDirectory();
	} catch (ignoreError) {
		return false;
	}
};

const addJSExtensionConditionally = (
	props: Readonly<{
		filePath: string;
		importPath: string;
		checkType: 'dts' | 'js';
	}>
) => {
	const check =
		props.checkType === 'js'
			? checkJavaScriptFileExistByAppend
			: checkTypeDefinitionFileExistByAppend;

	const skip = {
		procedure: 'skip',
	} as const;

	switch (isDirectory(props.filePath)) {
		case true: {
			const result = check({
				filePath: path.posix.join(props.filePath, 'index'),
			});

			if (!result) {
				return skip;
			}

			const file = `index${result.extension}`;

			return {
				procedure: 'proceed',
				absolutePath: result.filePath,
				importPath: formProperFilePath({
					filePath: `${props.importPath}${separator}${file}`,
				}),
			} as const;
		}
		case false: {
			const result = check({
				filePath: props.filePath,
			});

			if (!result) {
				return skip;
			}

			return {
				procedure: 'proceed',
				absolutePath: result.filePath,
				importPath: formProperFilePath({
					filePath: `${props.importPath}${result.extension}`,
				}),
			} as const;
		}
	}
};

const addJSExtension = (
	props: Readonly<{
		filePath: string;
		importPath: string;
	}>
): ReturnType<typeof addJSExtensionConditionally> => {
	if (matchJs(props.filePath)) {
		return {
			procedure: 'skip',
		};
	}

	const result = addJSExtensionConditionally({
		...props,
		checkType: 'js',
	});

	switch (result.procedure) {
		case 'proceed': {
			return result;
		}
		case 'skip': {
			return addJSExtensionConditionally({
				...props,
				checkType: 'dts',
			});
		}
	}
};

const traverseAndUpdateFileWithJSExtension = (files: Files) => {
	return ({ parsed, code }: SourceFile) => {
		const delimiter = '';
		const characters = code.split(delimiter);

		const file = parsed.fileName;

		const replaceNodes = parsed.statements.flatMap((statement) => {
			switch (statement.kind) {
				case ts.SyntaxKind.ImportDeclaration:
				case ts.SyntaxKind.ExportDeclaration: {
					const importExportDeclaration = statement as
						| ts.ExportDeclaration
						| ts.ImportDeclaration;

					if (!importExportDeclaration.moduleSpecifier) {
						return [];
					}

					const moduleSpecifier = asString({
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						value: importExportDeclaration.moduleSpecifier.text,
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
						.at(-1);

					if (!fileName) {
						throw new Error(
							`Impossible for file name to be non-existent for ${moduleSpecifier}`
						);
					}

					if (moduleSpecifier.startsWith('.')) {
						const result = addJSExtension({
							importPath: moduleSpecifier,
							filePath: path.posix.join(
								file,
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
												index >
													importExportDeclaration.pos &&
												index <
													importExportDeclaration.end
											);
										})
										.join(delimiter);

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
						file,
						code: replaceNodes.reduce((code, node) => {
							return code.replace(node.before, node.after);
						}, code),
					},
				];
	};
};

export default traverseAndUpdateFileWithJSExtension;
