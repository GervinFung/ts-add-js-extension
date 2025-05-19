import type { PartialConfig } from './cli-command-parser';

/**
 * @deprecated since version 1.4.0
 * Will be deleted in version 2.0
 * There is no need to parse config with this function
 * As configurations can be passed directly
 * Using this function will halt the program
 * And requires you to write configs directly
 * */
const parseConfig = (_: Readonly<Record<string, unknown>>) => {
	throw new Error(
		[
			`Function parseConfig should not be used, this function exists because of "yargs"`,
			`Now yargs is removed, cli arguments parser is hand-written`,
		].join('\n')
	);
};

type NormalisedConfig<T = PartialConfig> = Readonly<{
	[K in keyof T]-?: NonNullable<T[K]>;
}>;

const normaliseConfig = (
	config: PartialConfig
): Omit<NormalisedConfig, 'showChanges'> => {
	return {
		dir: config.dir,
		showProgress: config.showProgress ?? config.showChanges ?? true,
		include: config.include ?? [],
	};
};

export { normaliseConfig, parseConfig };
export type { PartialConfig as ParsedConfig };
