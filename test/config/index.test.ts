import { describe, it, expect } from 'vitest';

import { parseConfig } from '../../src';
import { normaliseConfig } from '../../src/config';

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

describe('Normalising config', () => {
	it('should normalise both `showChanges` and `showProgress` to `showProgress` only', () => {
		expect(
			normaliseConfig({
				dir: 'dir',
				showChanges: true,
				showProgress: false,
			})
		).toStrictEqual({
			dir: 'dir',
			showProgress: false,
			include: [],
		});
	});

	it('should normalise `showChanges` to `showProgress`', () => {
		expect(
			normaliseConfig({
				dir: 'dir',
				showChanges: true,
			})
		).toStrictEqual({
			dir: 'dir',
			showProgress: true,
			include: [],
		});
	});

	it('should normalise `showProgress` to `showProgress`', () => {
		expect(
			normaliseConfig({
				dir: 'dir',
				showProgress: true,
			})
		).toStrictEqual({
			dir: 'dir',
			showProgress: true,
			include: [],
		});
	});
});
