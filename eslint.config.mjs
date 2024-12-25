import process from 'process';

import { includeIgnoreFile } from '@eslint/compat';
import eslint from '@eslint/js';
import { node } from '@poolofdeath20/eslint-config';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	includeIgnoreFile(`${process.cwd()}/.gitignore`),
	eslint.configs.recommended,
	...tseslint.configs.strictTypeChecked,
	...tseslint.configs.stylisticTypeChecked,
	node,
	{
		ignores: ['test/process/source/**', 'test/process/expected-result/**'],
	}
);
