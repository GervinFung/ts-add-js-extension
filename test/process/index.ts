import { tsAddJsExtension } from '../../src';
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
        it('should be able to append ".js" extension for JavaScript file for all "sample.js" file', async () => {
            const result = await tsAddJsExtension({
                dir: 'test/output',
                showChanges: true,
            });
            expect(result.type).toBe('done');
        });
        it.each(
            Array.from({ length: 3 }, (_, index) => `${index + 1}.js`).concat([
                'index.js',
            ])
        )(
            'should read the code and ensure each import/export statemnt is properly formed for "%s"',
            async (file) => {
                expect(await readCode(`test/output/${file}`)).toMatchSnapshot();
            }
        );
    });

export default testTsAddJsExtension;
