import { describe, it, expect } from 'vitest';
import ParseArgs from '../../src/cli-command-parser';
import pkg from '../../package.json';

describe('Version argument parsing', () => {
    it('should parse config as help when help argument is absent', () => {
        expect(
            ParseArgs.create(['node', 'ts-add-js-extension']).asVersion()
        ).toStrictEqual({ proceed: false });
    });
    it('should parse config as help when help argument is given', () => {
        expect(
            ParseArgs.create([
                'node',
                'ts-add-js-extension',
                '--version',
            ]).asVersion()
        ).toStrictEqual({ proceed: true, value: pkg.version });
    });
});
