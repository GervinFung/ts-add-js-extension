import File from './read-write';
import ParseArgs, { type PartialConfig } from './cli-command-parser';
import { parseConfig, valuelizeConfig, type ParsedConfig } from './config';

const tsAddJsExtension = async ({
    config,
    parsedConfigFunction,
}: Readonly<{
    config: PartialConfig;
    /**
     * @deprecated since version 1.4.0
     * Will be deleted in version 2.0
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
}>) => {
    if (parsedConfigFunction) {
        throw new Error(
            [
                `Please do not use parsedConfigFunction as it's deprecated and contains complicated parsing`,
                `Instead, just pass configurations directly`,
            ].join('\n')
        );
    }

    const trueConfig = valuelizeConfig(config);
    const file = File.create();

    return file.writeMany({
        showChanges: trueConfig.showChanges,
        withJSExtension: await file.findMany(trueConfig),
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
        .catch(console.error);
};

export { parseConfig, tsAddJsExtension };
export default main;
