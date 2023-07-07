import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { tsAddJsExtension } from '../../src';

const getAllActualCodeWithFilePath = (
    dir: string
): ReadonlyArray<
    Readonly<{
        filePath: string;
        code: string;
    }>
> =>
    fs.readdirSync(dir).flatMap((file) => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            return getAllActualCodeWithFilePath(filePath);
        }
        const code = fs.readFileSync(filePath, { encoding: 'utf-8' });
        return [
            {
                filePath,
                code,
            },
        ];
    });

const getExpectedCode = (filePath: string) =>
    fs.readFileSync(filePath.replace('actual', 'expected'), {
        encoding: 'utf-8',
    });

describe('ts add js extension', () => {
    const getPath = (subPath: string) => path.join(__dirname, subPath);

    describe('for JavaScript files only', () => {
        const dir = getPath(path.join('actual-result', 'js'));

        const result = tsAddJsExtension({
            config: {
                dir,
            },
        });

        it('should be able to append either js or mjs file extension', async () => {
            expect((await result).type).toBe('done');
        });

        it.each(getAllActualCodeWithFilePath(dir))(
            'should assert that file extension was added to proper import/export statement for file %s',
            ({ filePath, code }) => {
                expect(code).toBe(getExpectedCode(filePath));
            }
        );
    });

    describe('for Type Definition files only', () => {
        const parentDir = getPath(path.join('actual-result', 'dts'));

        describe.each(
            fs
                .readdirSync(parentDir)
                .map((childPath) => path.join(parentDir, childPath))
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
                    ({ filePath, code }) => {
                        expect(code).toBe(getExpectedCode(filePath));
                    }
                );
            }
        );
    });
});
