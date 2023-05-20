import Log from '../../src/log';
import { describe, it, expect } from 'vitest';

describe('Log', () => {
    it('should create Log instance when there is at least one file to be changed', () => {
        expect(Log.fromNumberOfFiles(1)).toBeInstanceOf(Log);
    });
    it('should throw error when there is an attempt to instantiate Log but there is no file to be changed', () => {
        expect(() => Log.fromNumberOfFiles(0)).toThrowError();
    });
});
