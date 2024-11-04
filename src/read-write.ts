import type { PartialConfig } from './cli-command-parser';

import fs from 'fs';
import path from 'path';

import tsc from 'typescript';

import { matchEither, separator } from './const';
import Log from './log';
import traverseAndUpdateFile from './traverse-and-update';

type SourceFile = Awaited<ReturnType<typeof getAllJSAndDTSCodes>[0]>;

type Files = ReadonlyArray<string>;

const getAllJSAndDTSFiles = (directory: string): Files => {
	return fs.readdirSync(directory).flatMap((file) => {
		const filePath = path.posix.join(
			directory.split(path.sep).join(separator),
			file
		);

		if (fs.statSync(filePath).isDirectory()) {
			return getAllJSAndDTSFiles(filePath);
		}

		return !matchEither(filePath) ? [] : [filePath];
	});
};

const readCode = (file: string) => {
	return new Promise<string>((resolve, reject) => {
		const code = [] as Array<string>;

		fs.createReadStream(file)
			.on('data', (data) => {
				code.push(data.toString());
			})
			.on('end', () => {
				resolve(code.join(''));
			})
			.on('error', reject);
	});
};

const getAllJSAndDTSCodes = (files: Files) => {
	return files.map(async (file) => {
		const code = await readCode(file);
		return {
			file,
			code,
			parsed: tsc.createSourceFile(file, code, tsc.ScriptTarget.ESNext),
		};
	});
};

const findMany = async (
	props: Readonly<{
		dir: PartialConfig['dir'];
		include: ReadonlyArray<string>;
	}>
) => {
	// user may import files from `common` into `src`
	const files = props.include.concat(props.dir).flatMap(getAllJSAndDTSFiles);

	return await Promise.all(getAllJSAndDTSCodes(files));
};

const writeMany = async (
	props: Readonly<{
		showChanges: boolean;
		foundMany: Awaited<ReturnType<typeof findMany>>;
	}>
) => {
	const files = props.foundMany.map((data) => {
		return data.file;
	});

	const transformed = props.foundMany.flatMap(traverseAndUpdateFile(files));


	const repeat = transformed.reduce((longestFileName, { file }) => {
		return Math.max(longestFileName, file.length);
	}, 0);

	const log = !(transformed.length && props.showChanges)
		? undefined
		: Log.fromNumberOfFiles(transformed.length);

	try {
		const errors = (
			await Promise.all(
				transformed.map(({ code, file }) => {
					return new Promise<
						| undefined
						| Readonly<{
								file: string;
								error: NodeJS.ErrnoException;
						  }>
					>((resolve) => {
						return fs.writeFile(file, code, (error) => {
							log?.increment({
								repeat,
								file,
								succeed: !error,
							});

							resolve(
								!error
									? undefined
									: {
											file,
											error,
										}
							);
						});
					});
				})
			)
		).flatMap((element) => {
			return !element ? [] : [element];
		});

		log?.end({ errors });

		return {
			type: 'done',
		} as const;
	} catch (error) {
		return {
			type: 'error',
			error,
		} as const;
	}
};

export type { SourceFile, Files };
export { findMany, writeMany };
