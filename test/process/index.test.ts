import fs from 'fs';
import path from 'path';

import { describe, it, expect } from 'vitest';

import { tsAddJsExtension } from '../../src';

describe('ts add js extension', () => {
	const getPath = (subPath: string) => {
		return path.join(__dirname, subPath);
	};

	const getAllActualCodeWithFilePath = (
		dir: string
	): ReadonlyArray<
		Readonly<{
			code: Readonly<{
				actual: () => string;
				expected: () => string;
			}>;
		}>
	> => {
		return fs.readdirSync(dir).flatMap((file) => {
			const filePath = path.join(dir, file);

			if (fs.statSync(filePath).isDirectory()) {
				return getAllActualCodeWithFilePath(filePath);
			}

			return [
				{
					code: {
						actual: () => {
							return fs.readFileSync(filePath, {
								encoding: 'utf-8',
							});
						},
						expected: () => {
							return fs.readFileSync(
								filePath.replace('actual', 'expected'),
								{
									encoding: 'utf-8',
								}
							);
						},
					},
				},
			];
		});
	};

	describe('for JavaScript files only', () => {
		const parentDir = getPath(path.join('actual-result', 'js'));

		const javaScriptIncludes = fs
			.readdirSync(parentDir)
			.map((childPath) => {
				return path.join(parentDir, childPath);
			});

		describe.each(javaScriptIncludes)(
			'assert that it will work for JavaScript files with import/export statement',
			(dir) => {
				const result = tsAddJsExtension({
					config: {
						dir,
						include: javaScriptIncludes,
					},
				});

				it('should be able to append either js or mjs file extension', async () => {
					expect((await result).type).toBe('done');
				});

				it.each(getAllActualCodeWithFilePath(dir))(
					'should assert that file extension was added to proper import/export statement for file %s',
					async ({ code }) => {
						await result;
						expect(code.actual()).toBe(code.expected());
					}
				);
			}
		);
	});

	describe('for Type Definition files only', () => {
		const parentDir = getPath(path.join('actual-result', 'dts'));

		describe.each(
			fs.readdirSync(parentDir).map((childPath) => {
				return path.join(parentDir, childPath);
			})
		)(
			'assert that it will work for Type Definition files with or without JavaScript',
			(dir) => {
				const result = tsAddJsExtension({
					config: {
						dir,
					},
				});

				it(`should be able to append .js/.mjs extension for Type Definition file of ${dir}`, async () => {
					expect((await result).type).toBe('done');
				});

				it.each(getAllActualCodeWithFilePath(dir))(
					'should assert that file extension was added to proper import/export statement',
					async ({ code }) => {
						await result;
						expect(code.actual()).toBe(code.expected());
					}
				);
			}
		);
	});
});
