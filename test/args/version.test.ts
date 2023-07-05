import { describe, it, expect } from 'vitest';
import ParseArgs from '../../src/cli-command-parser';
import pkg from '../../package.json';

describe('Version argument parsing', () => {
    it('should parse config as help when help argument is absent', () => {
        expect(
            ParseArgs.create(
                ['node', 'ts-add-js-extension'].join(' ')
            ).asVersion()
        ).toStrictEqual({ exists: false });
    });
    it('should parse config as help when help argument is given', () => {
        expect(
            ParseArgs.create(
                ['node', 'ts-add-js-extension', '--version'].join(' ')
            ).asVersion()
        ).toStrictEqual({ type: 'version', exists: true, value: pkg.version });
    });
});
