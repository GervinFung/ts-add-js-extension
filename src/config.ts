import yargs from 'yargs';

type ParsedConfig = Readonly<{
    dir: string;
    showChanges?: boolean;
    extension?: 'js' | 'mjs';
    include?: ReadonlyArray<string>;
}>;

type FinalizedConfig = ReturnType<typeof finalizedConfig>;

type Argv = Parameters<
    Parameters<ReturnType<typeof yargs>['command']>[0]['handler']
>[0];

const parseConfig = (argv: Argv): ParsedConfig => {
    const include = argv['include'];

    const parseExtension = (extension: unknown) => {
        switch (extension) {
            case undefined: {
                return undefined;
            }
            case 'js':
            case 'mjs': {
                return extension;
            }
        }
        throw new Error(
            `${extension} is not a valid JavaScript file extension`
        );
    };

    return {
        dir: argv['dir'] as string,
        showChanges: argv['showchanges'] as boolean,
        extension: parseExtension(argv['extension']),
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
        extension: `.${config.extension ?? 'js'}`,
        showChanges: config.showChanges ?? true,
    } as const);

export { finalizedConfig, parseConfig };
export type { FinalizedConfig, ParsedConfig };
