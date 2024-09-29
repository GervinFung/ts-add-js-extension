import { describe, it, expect } from 'vitest';

import { parseConfig } from '../../src';

describe('Config parsing', () => {
	it('should throw error when parsing config the old way', () => {
		expect(() => {
			// eslint-disable-next-line @typescript-eslint/no-deprecated
			return parseConfig({
				dir: 'dir',
				include: ['hi'],
			});
		}).toThrowError();
	});

	it('should parse config when only non optional config options are given', () => {
		expect(() => {
			// eslint-disable-next-line @typescript-eslint/no-deprecated
			return parseConfig({
				dir: 'dir',
			});
		}).toThrowError();
	});
});
