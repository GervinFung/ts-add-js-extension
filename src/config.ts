import yargs from 'yargs';

type ParsedConfig = Readonly<{
    dir: string;
    showChanges?: boolean;
    include?: ReadonlyArray<string>;
}>;

type FinalizedConfig = ReturnType<typeof finalizedConfig>;

type Argv = Parameters<
    Parameters<ReturnType<typeof yargs>['command']>[0]['handler']
>[0];

/**
 * Internal use and for testing only
 **/
const parseConfig = (argv: Argv): ParsedConfig => {
    const include = argv['include'];

    return {
        dir: argv['dir'] as string,
        showChanges: argv['showchanges'] as boolean,
        include: !Array.isArray(include)
            ? undefined
            : include.map((dir) => {
                  const type = typeof dir;
                  if (type === 'string') {
                      return dir as string;
                  }
                  throw new Error(
                      `expect ${dir} to be string, got dir: ${dir} as ${type} instead`
                  );
              }),
    };
};

const finalizedConfig = (config: ParsedConfig) =>
    ({
        ...config,
        include: config.include ?? [],
        showChanges: config.showChanges ?? true,
    } as const);

export { finalizedConfig, parseConfig };
export type { FinalizedConfig, ParsedConfig };
