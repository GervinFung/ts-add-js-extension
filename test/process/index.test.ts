import fs from 'fs';
import path from 'path';
import child from 'child_process';
import { describe, it, expect, beforeAll } from 'vitest';
import { tsAddJsExtension } from '../../src';

describe('ts add js extension', () => {
    const getPath = (subPath: string) => path.join(__dirname, subPath);

    beforeAll(() => {
        console.log({
            output: child.execSync('pnpm test-setup').toString(),
        });
    });
    it('should be able to append .js/.mjs extension for JavaScript file', async () => {
        const result = await tsAddJsExtension({
            config: {
                dir: getPath(path.join('actual-result', 'js')),
            },
        });
        expect(result.type).toBe('done');
        // actual result = expected result
        expect(result.type).toBe('done');
    });
    it.each(
        (() => {
            const parentDir = getPath(path.join('actual-result', 'dts'));
            return fs
                .readdirSync(parentDir)
                .map((childPath) => path.join(parentDir, childPath));
        })()
    )(
        'should be able to append .js/.mjs extension for Type Definition file of %s',
        async (dir) => {
            const result = await tsAddJsExtension({
                config: {
                    dir,
                },
            });
            // actual result = expected result
            expect(result.type).toBe('done');
        }
    );
});
