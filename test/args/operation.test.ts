import { describe, it, expect } from 'vitest';
import ParseArgs from '../../src/cli-command-parser';

describe('Operation arguments parsing', () => {
    const delimiter = ['=', ' '] as const;

    it.each(delimiter)(
        'should parse config when all options are given with assignment of %s and "add" is absent',
        (delimiter) => {
            expect(
                ParseArgs.create(
                    [
                        'node',
                        'ts-add-js-extension',
                        `--dir${delimiter}build/mjs`,
                        `--include${delimiter}build/dts`,
                        `--showchanges${delimiter}true`,
                    ]
                        .join(' ')
                        .split(' ')
                ).asOperation()
            ).toStrictEqual({
                dir: 'build/mjs',
                include: ['build/dts'],
                showChanges: true,
            });
        }
    );
    it.each(delimiter)(
        'should parse config when optional options are absent with assignment of %s',
        (delimiter) => {
            expect(
                ParseArgs.create(
                    [
                        'node',
                        'ts-add-js-extension',
                        'add',
                        `--dir${delimiter}build/mjs`,
                    ]
                        .join(' ')
                        .split(' ')
                ).asOperation()
            ).toStrictEqual({
                dir: 'build/mjs',
                include: undefined,
                showChanges: undefined,
            });
        }
    );
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
