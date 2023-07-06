import fs from 'fs';
import path from 'path';
import child from 'child_process';
import { describe, it, expect, beforeAll } from 'vitest';
import { tsAddJsExtension } from '../../src';

describe('ts add js extension', () => {
    const getPath = (subPath: string) => path.join(__dirname, subPath);

    beforeAll(() => {
        const testSetup =
            'cd test/process && shx cp -rf source actual-result && pnpm prebuild';

        console.log({
            output: child.execSync(testSetup).toString(),
        });
    });

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

        it.each(
            fs
                .readdirSync(dir)
                .map((file) => path.join(dir, file))
                .map((file) => ({
                    file,
                    content: fs.readFileSync(file, { encoding: 'utf-8' }),
                }))
        )(
            'should assert that file extension was added to proper import/export statement',
            ({ file, content }) => {
                expect(content).toBe(
                    fs.readFileSync(file.replace('actual', 'expected'), {
                        encoding: 'utf-8',
                    })
                );
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

                it.each(
                    fs
                        .readdirSync(dir)
                        .map((file) => path.join(dir, file))
                        .map((file) => ({
                            file,
                            content: fs.readFileSync(file, {
                                encoding: 'utf-8',
                            }),
                        }))
                )(
                    'should assert that file extension was added to proper import/export statement',
                    ({ file, content }) => {
                        expect(content).toBe(
                            fs.readFileSync(
                                file.replace('actual', 'expected'),
                                {
                                    encoding: 'utf-8',
                                }
                            )
                        );
                    }
                );
            }
        );
    });
});
