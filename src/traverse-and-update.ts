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
}>) => filePath.split(separator).filter(Boolean).join(separator);

const checkJavaScriptFileExistByAppend = ({
	filePath,
}: Readonly<{
	filePath: string;
}>) => {
	const { js, mjs } = extensionsUtil().extensions;
	if (fs.existsSync(`${filePath}${js}`)) {
		return js;
	}
	if (fs.existsSync(`${filePath}${mjs}`)) {
		return mjs;
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

const addJSExtension = ({
	filePath,
	importPath,
}: Readonly<{
	filePath: string;
	importPath: string;
}>): Readonly<
	| {
			procedure: 'skip';
	  }
	| {
			procedure: 'proceed';
			importPath: string;
			filePathImported: string;
	  }
> => {
	if (extensionsUtil().matchAnyJs(filePath)) {
		return {
			procedure: 'skip',
		};
	}
	if (!isDirectory(filePath)) {
		const extension = checkJavaScriptFileExistByAppend({
			filePath,
		});
		if (!extension) {
			return {
				procedure: 'skip',
			};
		}
		return {
			procedure: 'proceed',
			importPath: formProperFilePath({
				filePath: `${importPath}${extension}`,
			}),
			filePathImported: formProperFilePath({
				filePath: `${filePath}${extension}`,
			}),
		};
	}
	const extension = checkJavaScriptFileExistByAppend({
		filePath: path.posix.join(filePath, 'index'),
	});
	if (!extension) {
		return {
			procedure: 'skip',
		};
	}

	const file = `index${extension}`;

	return {
		procedure: 'proceed',
		importPath: formProperFilePath({
			filePath: [importPath, separator, file].join(''),
		}),
		filePathImported: formProperFilePath({
			filePath: [filePath, separator, file].join(''),
		}),
	};
};

const traverseAndUpdateFileWithJSExtension =
	(files: Files) => (sourceFile: SourceFile) => {
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

					const separator = '/';

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
								const { filePathImported, importPath } = result;
								if (
									files.find((file) =>
										file.endsWith(filePathImported)
									)
								) {
									const before = characters
										.filter(
											(_, index) =>
												index > imExDeclaration.pos &&
												index < imExDeclaration.end
										)
										.join(charactersDelimiter);

									return [
										{
											before,
											after: before.replace(
												moduleSpecifier,
												importPath
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
						code: replaceNodes.reduce(
							(prev, { before, after }) =>
								prev.replace(before, after),
							code
						),
					},
			  ];
	};

export default traverseAndUpdateFileWithJSExtension;
