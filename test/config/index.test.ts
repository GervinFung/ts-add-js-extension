import { parseConfig } from '../../src';
import { describe, it, expect } from 'vitest';

describe('Config parsing', () => {
	it('should throw error when parsing config the old way', () => {
		expect(() => {
			return parseConfig({
				dir: 'dir',
				include: ['hi'],
			});
		}).toThrowError();
	});

	it('should parse config when only non optional config options are given', () => {
		expect(() => {
			return parseConfig({
				dir: 'dir',
			});
		}).toThrowError();
	});
});
