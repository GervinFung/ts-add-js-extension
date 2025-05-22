import type { Metainfo, Files } from './read-write';

import fs from 'fs';
import path from 'path';

import tsc from 'typescript';

import { extensions, matchJs, separator } from './const';
import { guard } from './type';

type FileInfo = Readonly<{
	file: string;
	files: Files;
}>;

type FileInfoWithUpdateFile = FileInfo &
	Readonly<{
		updateFile: () => void;
	}>;

type FactoryWithFileInfo = Readonly<{
	factory: tsc.NodeFactory;
	fileInfo: FileInfoWithUpdateFile;
}>;

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

const generateModuleSpecifier = (
	props: FileInfo &
		Readonly<{
			moduleSpecifier: string;
		}>
) => {
	if (!props.moduleSpecifier.startsWith('.')) {
		return undefined;
	}

	const result = addJSExtension({
		importPath: props.moduleSpecifier,
		filePath: path.posix.join(props.file, '..', props.moduleSpecifier),
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

const nodeIsStringLiteral = (node: tsc.Node) => {
	return (
		tsc.isStringLiteral(node) || tsc.isNoSubstitutionTemplateLiteral(node)
	);
};

const dynamicJsImport = (
	props: FactoryWithFileInfo &
		Readonly<{
			node: tsc.CallExpression;
		}>
) => {
	const { node } = props;

	if (node.expression.kind === tsc.SyntaxKind.ImportKeyword) {
		const argument = guard({
			value: node.arguments[0],
			error: new Error(`Dynamic import must have a path`),
		});

		if (nodeIsStringLiteral(argument)) {
			const text = generateModuleSpecifier({
				...props.fileInfo,
				moduleSpecifier: argument.text,
			});

			if (!text) {
				return node;
			}

			props.fileInfo.updateFile();

			return props.factory.updateCallExpression(
				node,
				node.expression,
				node.typeArguments,
				[props.factory.createStringLiteral(text)]
			);
		}
	}

	return node;
};

const dynamicDtsImport = (
	props: FactoryWithFileInfo &
		Readonly<{
			node: tsc.ImportTypeNode;
		}>
) => {
	const { node } = props;
	const { argument } = node;

	if (tsc.isLiteralTypeNode(argument)) {
		const { literal } = argument;

		if (nodeIsStringLiteral(literal)) {
			const text = generateModuleSpecifier({
				...props.fileInfo,
				moduleSpecifier: literal.text,
			});

			if (!text) {
				return node;
			}

			props.fileInfo.updateFile();

			return props.factory.updateImportTypeNode(
				node,
				props.factory.updateLiteralTypeNode(
					argument,
					props.factory.createStringLiteral(text)
				),
				node.attributes,
				node.qualifier,
				node.typeArguments,
				node.isTypeOf
			);
		}
	}

	return node;
};

const staticImportExport = (
	props: FactoryWithFileInfo &
		Readonly<{
			node: tsc.ImportDeclaration | tsc.ExportDeclaration;
		}>
) => {
	const { node } = props;
	const { moduleSpecifier } = node;

	if (!moduleSpecifier || !tsc.isStringLiteral(moduleSpecifier)) {
		return node;
	}

	const text = generateModuleSpecifier({
		...props.fileInfo,
		moduleSpecifier: moduleSpecifier.text,
	});

	if (!text) {
		return node;
	}

	props.fileInfo.updateFile();

	if (tsc.isImportDeclaration(node)) {
		return props.factory.updateImportDeclaration(
			node,
			node.modifiers,
			node.importClause,
			props.factory.createStringLiteral(text),
			node.attributes
		);
	}

	return props.factory.updateExportDeclaration(
		node,
		node.modifiers,
		node.isTypeOnly,
		node.exportClause,
		props.factory.createStringLiteral(text),
		node.attributes
	);
};

const updateImportExport = (
	props: Readonly<{
		context: tsc.TransformationContext;
		fileInfo: FileInfoWithUpdateFile;
	}>
) => {
	return (parent: tsc.Node): tsc.Node => {
		const node = tsc.visitEachChild(
			parent,
			updateImportExport(props),
			props.context
		);

		const parameters = {
			fileInfo: props.fileInfo,
			factory: props.context.factory,
		};

		if (tsc.isImportDeclaration(node) || tsc.isExportDeclaration(node)) {
			return staticImportExport({
				...parameters,
				node,
			});
		} else if (tsc.isCallExpression(node)) {
			return dynamicJsImport({
				...parameters,
				node,
			});
		} else if (tsc.isImportTypeNode(node)) {
			return dynamicDtsImport({
				...parameters,
				node,
			});
		}

		return node;
	};
};

const traverse = (
	props: Omit<Parameters<typeof updateImportExport>[0], 'context'>
) => {
	return (context: tsc.TransformationContext) => {
		return (rootNode: tsc.Node) => {
			return tsc.visitNode(
				rootNode,
				updateImportExport({
					...props,
					context,
				})
			);
		};
	};
};

const traverseAndUpdateFile = (metainfo: Metainfo) => {
	const printer = tsc.createPrinter();

	let fileUpdated = false as boolean;

	const { fileName: file } = metainfo.sourceFile;

	const transformer = traverse({
		fileInfo: {
			files: metainfo.files,
			file,
			updateFile: () => {
				fileUpdated = true;
			},
		},
	});

	const code = printer.printNode(
		tsc.EmitHint.Unspecified,
		guard({
			value: tsc
				.transform(metainfo.sourceFile, [transformer])
				.transformed.at(0),
			error: new Error('Transformer should have a transformed value'),
		}),
		metainfo.sourceFile
	);

	if (!fileUpdated) {
		return [];
	}

	return [
		{
			file,
			code,
		},
	];
};

export default traverseAndUpdateFile;
