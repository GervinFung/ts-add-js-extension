import type { PartialConfig } from './cli-command-parser';
import type { ParsedConfig } from './config';

import ParseArgs from './cli-command-parser';
import { parseConfig, normaliseConfig } from './config';
import { writeMany, findMany } from './read-write';

const tsAddJsExtension = async (
	props: Readonly<{
		config: PartialConfig;
		/**
		 * @deprecated since version 1.4.0
		 * Will be removed in version 2.0
		 * To pass configurations to `tsAddJsExtension`
		 * Just pass the configurations directly
		 * ```
		 * tsAddJsExtension({
		 *  config:{
		 *   dir:'dist'
		 *  }
		 * })
		 * ```
		 * Instead of passing with this function
		 * ```
		 * tsAddJsExtension({
		 *  parsedConfigFunction: () => parseConfig(argv)
		 * })
		 * ```
		 * As it will be ignroed
		 */
		parsedConfigFunction?: () => ParsedConfig;
	}>
) => {
	// eslint-disable-next-line @typescript-eslint/no-deprecated
	if (props.parsedConfigFunction) {
		throw new Error(
			[
				`Please do not use parsedConfigFunction as it's deprecated and contains complicated parsing`,
				`Instead, just pass configurations directly`,
			].join('\n')
		);
	}

	const normalisedConfig = normaliseConfig(props.config);

	return writeMany({
		showProgress: normalisedConfig.showProgress,
		foundMany: await findMany(normalisedConfig),
	});
};

const main = (args: string) => {
	const parser = ParseArgs.create(args);
	const help = parser.asHelp();

	if (help.exists) {
		return console.log(help.value);
	}

	const version = parser.asVersion();

	if (version.exists) {
		return console.log(version.value);
	}

	return tsAddJsExtension({
		config: parser.asOperation(),
	})
		.then((result) => {
			switch (result.type) {
				case 'error': {
					console.error(result.error);
				}
			}
		})
		.catch((error: unknown) => {
			console.error(error);
		});
};

export { parseConfig, tsAddJsExtension };
export default main;
