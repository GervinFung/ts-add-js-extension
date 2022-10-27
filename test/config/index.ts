import { parseConfig } from '../../src';
import { describe, it, expect } from 'vitest';

const testParseConfig = () => {
    describe('Config parsing', () => {
        it('should parse config when all config options are given', () => {
            const options = {
                dir: 'dir',
                include: ['hi'],
            };
            expect(
                parseConfig({
                    _: [],
                    $0: '',
                    ...options,
                    extension: 'mjs',
                    showchanges: true,
                })
            ).toStrictEqual({
                ...options,
                extension: 'mjs',
                showChanges: true,
            });
        });
        it('should parse config when only non optional config options are given', () => {
            const options = {
                dir: 'dir',
            };
            expect(
                parseConfig({
                    _: [],
                    $0: '',
                    ...options,
                })
            ).toStrictEqual({
                ...options,
                include: undefined,
                extension: undefined,
                showChanges: undefined,
            });
        });
    });
};

export default testParseConfig;
