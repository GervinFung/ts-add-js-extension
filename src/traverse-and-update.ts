import type { SourceFile, Files } from './read-write';

import fs from 'fs';
import path from 'path';

import tsc from 'typescript';

import { extensions, matchJs, separator } from './const';
import { asString, guard } from './type';

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

const isDirectory = (path: string) => {
	return fs.existsSync(path) && fs.lstatSync(path).isDirectory();
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

	if (isDirectory(props.filePath)) {
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
};

const addJSExtension = (
	props: Readonly<{
		filePath: string;
		importPath: string;
	}>
) => {
	if (matchJs(props.filePath)) {
		return {
			procedure: 'skip',
		} as const;
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

const moduleSpecifier = (
	props: Readonly<{
		file: string;
		files: Files;
		node: tsc.ImportDeclaration | tsc.ExportDeclaration;
	}>
) => {
	if (!props.node.moduleSpecifier) {
		return undefined;
	}

	const moduleSpecifier = asString({
		// @ts-expect-error: text is string
		value: props.node.moduleSpecifier.text,
		error: new Error('Module specifier of node should have text'),
	});

	if (!moduleSpecifier.startsWith('.')) {
		return undefined;
	}

	const result = addJSExtension({
		importPath: moduleSpecifier,
		filePath: path.posix.join(props.file, '..', moduleSpecifier),
	});

	switch (result.procedure) {
		case 'proceed': {
			if (
				props.files.find((file) => {
					return file.endsWith(result.absolutePath);
				})
			) {
				return result.importPath;
			}
		}
	}

	return undefined;
};

const updateImportExport = (
	context: tsc.TransformationContext,
	fileInfo: Readonly<
		Omit<Parameters<typeof moduleSpecifier>[0], 'node'> & {
			updatedFiles: Set<string>;
		}
	>
) => {
	return (parent: tsc.Node) => {
		const node = tsc.visitEachChild(
			parent,
			updateImportExport(context, fileInfo),
			context
		);

		if (tsc.isImportDeclaration(node)) {
			const text = moduleSpecifier({
				...fileInfo,
				node,
			});

			if (!text) {
				return node;
			}

			fileInfo.updatedFiles.add(fileInfo.file);

			return context.factory.updateImportDeclaration(
				node,
				undefined,
				node.importClause,
				{
					...node.moduleSpecifier,
					// @ts-expect-error: text is string
					text,
				},
				undefined
			);
		} else if (tsc.isExportDeclaration(node)) {
			const text = moduleSpecifier({
				...fileInfo,
				node,
			});

			if (!text) {
				return node;
			}

			fileInfo.updatedFiles.add(fileInfo.file);

			return context.factory.updateExportDeclaration(
				node,
				undefined,
				node.isTypeOnly,
				node.exportClause,
				{
					...node.moduleSpecifier,
					// @ts-expect-error: text is string
					text,
				},
				undefined
			);
		}

		return node;
	};
};

const traverse = (props: Parameters<typeof updateImportExport>[1]) => {
	return (context: tsc.TransformationContext) => {
		return (rootNode: tsc.Node) => {
			return tsc.visitNode(rootNode, updateImportExport(context, props));
		};
	};
};

const traverseAndUpdateFile = (files: Files) => {
	const printer = tsc.createPrinter();

	const updatedFiles = new Set<string>();

	return (source: SourceFile) => {
		const { fileName: file } = source.parsed;

		const transformer = traverse({
			files,
			file,
			updatedFiles,
		});

		const code = printer.printNode(
			tsc.EmitHint.Unspecified,
			guard({
				value: tsc.transform(source.parsed, [transformer])
					.transformed[0],
				error: new Error('Transformer should have a transformed value'),
			}),
			tsc.createSourceFile('', '', tsc.ScriptTarget.Latest)
		);

		if (!updatedFiles.has(file)) {
			return [];
		}

		return [
			{
				file,
				code,
			},
		];
	};
};

export default traverseAndUpdateFile;
