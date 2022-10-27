import { tsAddJsExtension } from '../../src';
import { describe, it, expect } from 'vitest';
import fs from 'fs';

const testTsAddJsExtension = () =>
    describe('ts add js extension', () => {
        const readCode = (files: string): Promise<string> =>
            new Promise((resolve, reject) => {
                let fetchData = '';
                fs.createReadStream(files)
                    .on('data', (data) => {
                        fetchData = data.toString();
                    })
                    .on('end', () => resolve(fetchData))
                    .on('error', reject);
            });
        it.each(['js', 'mjs'] as const)(
            'should be able to append "%s" extension for JavaScript file',
            async (extension) => {
                const result = await tsAddJsExtension({
                    extension,
                    dir: 'test/output',
                    showChanges: true,
                });
                expect(result.type).toBe('done');
            }
        );
        it.each(
            Array.from({ length: 3 }, (_, index) => [
                `${index + 1}.js`,
                `${index + 1}.mjs`,
            ])
                .concat(['index.js', 'index.mjs'])
                .flat()
        )(
            'should read the code and ensure each import/export statemnt is properly formed for "%s"',
            async (file) => {
                expect(await readCode(`test/output/${file}`)).toMatchSnapshot();
            }
        );
    });

export default testTsAddJsExtension;
