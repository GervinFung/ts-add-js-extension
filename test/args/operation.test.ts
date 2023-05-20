import { describe, it, expect } from 'vitest';
import ParseArgs from '../../src/cli-command-parser';

describe('Operation arguments parsing', () => {
    it('should parse config when all options are given and "add" is absent', () => {
        expect(
            ParseArgs.create([
                'node',
                'ts-add-js-extension',
                '--dir=build/mjs',
                '--include=build/dts',
                '--showchanges=true',
                '--showprogress',
            ]).asOperation()
        ).toStrictEqual({
            dir: 'build/mjs',
            include: ['build/dts'],
            showChanges: true,
            showProgress: true,
        });
    });
    it('should parse config when optional options are absent', () => {
        expect(
            ParseArgs.create([
                'node',
                'ts-add-js-extension',
                'add',
                '--dir=build/mjs',
            ]).asOperation()
        ).toStrictEqual({
            dir: 'build/mjs',
            include: undefined,
            showChanges: undefined,
            showProgress: undefined,
        });
    });
    it('should parse config and throw error when mandatory options are absent', () => {
        expect(() =>
            ParseArgs.create([
                'node',
                'ts-add-js-extension',
                'add',
                '--include=build/dts',
                '--showchanges=true',
            ]).asOperation()
        ).toThrowError();
    });
});
