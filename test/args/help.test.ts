import fs from 'fs';
import { describe, it, expect } from 'vitest';
import ParseArgs from '../../src/cli-command-parser';

describe('Help argument parsing', () => {
    const result = {
        proceed: true,
        guide: fs.readFileSync('public/help.md', { encoding: 'utf-8' }),
    };
    it('should parse config as help when help argument is absent', () => {
        expect(
            ParseArgs.create(['node', 'ts-add-js-extension']).asHelp()
        ).toStrictEqual(result);
    });
    it('should parse config as help when help argument is given', () => {
        expect(
            ParseArgs.create(['node', 'ts-add-js-extension', '--help']).asHelp()
        ).toStrictEqual(result);
    });
});
