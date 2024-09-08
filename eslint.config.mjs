import process from 'process';

// eslint-disable-next-line import/no-extraneous-dependencies
import { includeIgnoreFile } from '@eslint/compat';
// eslint-disable-next-line import/no-extraneous-dependencies
import eslint from '@eslint/js';
import { node } from '@poolofdeath20/eslint-config';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	includeIgnoreFile(`${process.cwd()}/.gitignore`),
	eslint.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,
	...tseslint.configs.strict,
	...tseslint.configs.stylistic,
	node,
	{
		ignores: ['test/process/source/**', 'test/process/expected-result/**'],
	}
);
