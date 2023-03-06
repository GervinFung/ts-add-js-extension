import yargs from 'yargs';
import file from './read-write';
import { hideBin } from 'yargs/helpers';
import { finalizedConfig, parseConfig, ParsedConfig } from './config';

const tsAddJsExtension = async ({
    parsedConfigFunction,
}: Readonly<{
    parsedConfigFunction: () => ParsedConfig;
}>) => {
    const config = finalizedConfig(parsedConfigFunction());
    const fileInstance = file();
    return fileInstance
        .writeMany({
            showChanges: config.showChanges,
            withJSExtension: await fileInstance.findMany({
                dir: config.dir,
                include: config.include,
            }),
        })
        .then(
            () =>
                ({
                    type: 'done',
                } as const)
        )
        .catch(
            (error) =>
                ({
                    type: 'error',
                    error,
                } as const)
        );
};

const main = (args: Array<string>) => {
    const describe =
        'Use to add .js extension for the relative import/export statement in the JavaScript code if there is lack of .js extension in the import/export statement.';
    return yargs(hideBin(args))
        .usage(describe)
        .command({
            command: 'add',
            describe,
            builder: {
                dir: {
                    type: 'string',
                    demandOption: true,
                    describe: 'The folder that need to add .js extension',
                },
                include: {
                    type: 'array',
                    demandOption: false,
                    describe:
                        'The folder of files that is imported or included in `dir` folder, exclusing the `dir` specified',
                },
                showchanges: {
                    default: true,
                    type: 'boolean',
                    demandOption: false,
                    describe:
                        'Show changes made to import/export declaration in table format',
                },
            },
            handler: (argv) => {
                tsAddJsExtension({
                    parsedConfigFunction: () => parseConfig(argv),
                })
                    .then((result) => {
                        switch (result.type) {
                            case 'error': {
                                console.error(result.error);
                            }
                        }
                    })
                    .catch(console.error);
            },
        })
        .example(
            "Assume javascript files are placed in folder called 'build'\nThe command will be as below\n$0 add --dir=dist --include=common dist build --showchanges=true",
            [
                '1. "dir" stands for the directory of that needs to add .js extension. (string)',
                `2. "include" stands for the directory of files that is imported or included in 'dir' folder, exclusing the 'dir' specified. (array)`,
                '3. "showchanges" determines whether to show the changes made to import/export in table format. (boolean)',
            ].join('\n')
        )
        .help()
        .strict().argv;
};

export { parseConfig, tsAddJsExtension };
export default main;
