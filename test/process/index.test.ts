import fs from 'fs';
import child from 'child_process';
import { describe, it, expect, beforeAll } from 'vitest';
import file from '../../src/read-write';
import { tsAddJsExtension } from '../../src';

describe('ts add js extension', () => {
    const output = 'test/output';
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
    beforeAll(() => {
        console.log({
            output: child.execSync('pnpm test-setup').toString(),
        });
    });
    it('should be able to append .js/.mjs extension for JavaScript file', async () => {
        const result = await tsAddJsExtension({
            createFileInstance: file,
            parsedConfigFunction: () => ({
                dir: 'test/output',
            }),
        });
        expect(result.type).toBe('done');
    });
    it.each(
        Array.from({ length: 6 }, (_, index) =>
            [`${index + 1}.js`, `${index + 1}.mjs`].filter((file) =>
                fs.existsSync(`${output}/${file}`)
            )
        )
            .concat(['index.js'])
            .flat()
    )(
        'should read the code and ensure each import/export statemnt is properly formed for "%s"',
        async (file) => {
            expect(await readCode(`${output}/${file}`)).toMatchSnapshot();
        }
    );
});
