import yargs from 'yargs';
import file from './read-write';
import { hideBin } from 'yargs/helpers';
import { finalizedConfig, parseConfig, ParsedConfig } from './config';

const tsAddJsExtension = async ({
    createFileInstance,
    parsedConfigFunction,
}: Readonly<{
    createFileInstance: () => ReturnType<typeof file>;
    parsedConfigFunction: () => ParsedConfig;
}>) => {
    const config = finalizedConfig(parsedConfigFunction());
    const fileInstance = createFileInstance();
    return fileInstance
        .writeMany({
            extension: config.extension,
            showChanges: config.showChanges,
            withJSExtension: await fileInstance.findMany({
                dir: config.dir,
                include: config.include,
                extension: config.extension,
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
                extension: {
                    default: 'js',
                    type: 'string',
                    demandOption: false,
                    describe:
                        'Valid JavaScript file extension to append to each relative import/export, i.e. `mjs` or `js`',
                },
            },
            handler: (argv) => {
                tsAddJsExtension({
                    createFileInstance: file,
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
            "Assume javascript files are placed in folder called 'build'\nThe command will be as below\n$0 add --dir=dist --include=common dist build --showchanges=true --extension=mjs",
            [
                '1. "dir" stands for the directory of that needs to add .js extension. (string)',
                `2. "include" stands for the directory of files that is imported or included in 'dir' folder, exclusing the 'dir' specified. (array)`,
                '3. "showchanges" determines whether to show the changes made to import/export in table format. (boolean)',
                '4. "extension" search for JavaScript file that ends with that extension, and add that extension to each relative import/export',
            ].join('\n')
        )
        .help()
        .strict().argv;
};

export { parseConfig, tsAddJsExtension };
export default main;
