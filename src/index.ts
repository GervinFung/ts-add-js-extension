import * as Eslint from '@typescript-eslint/typescript-estree';
import fs from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Table } from 'console-table-printer';
import path from 'path';

type Node = Readonly<{
    file: string;
    code: string;
    ast: Eslint.AST<
        Readonly<{
            loc: true;
        }>
    >;
}>;

type AddJSNode = Readonly<{
    before: string;
    after: string;
}>;

type WriteCode = Readonly<{
    code: string;
    file: string;
}>;

type Files = ReadonlyArray<string>;

type ReplaceNodes = ReadonlyArray<AddJSNode>;

type Dir = string;

const getAllJavaScriptFiles = (dir: string): Files =>
    fs.readdirSync(dir).flatMap((file) => {
        const filePath = `${dir}/${file}`;
        return fs.statSync(filePath).isDirectory()
            ? getAllJavaScriptFiles(filePath)
            : !(path.extname(filePath) === '.js')
            ? []
            : [filePath];
    });

const readCode = (files: string): Promise<string> =>
    new Promise((resolve, reject) => {
        let fetchData = '';
        fs.createReadStream(files)
            .on('data', (data) => {
                fetchData = data.toString();
            })
            .on('end', () => resolve(fetchData))
            .on('error', reject);
    });

const getAllJavaScriptCodes = (files: Files): ReadonlyArray<Promise<Node>> =>
    files.map(async (file) => {
        const code = await readCode(file);
        return {
            file,
            code,
            ast: Eslint.parse(code, { loc: true }),
        };
    });

const formProperFilePath = ({
    delimiter,
    filePath,
}: Readonly<{
    delimiter: string;
    filePath: string;
}>) => filePath.split(delimiter).filter(Boolean).join(delimiter);

const addJSExtension = ({
    filePath,
    delimiter,
    importPath,
}: Readonly<{
    filePath: string;
    importPath: string;
    delimiter: string;
}>): Readonly<
    | {
          type: 'skip';
      }
    | {
          type: 'proceed';
          importPath: string;
          filePathForFileImported: string;
      }
> => {
    const isDirectory =
        fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory();
    const isJavaScript = !isDirectory && path.extname(filePath) === '.js';
    if (isJavaScript) {
        return {
            type: 'skip',
        };
    }
    const defaultFile = `${!isDirectory ? '' : '/index'}.js`;
    return {
        type: 'proceed',
        importPath: formProperFilePath({
            delimiter,
            filePath: `${importPath}${defaultFile}`,
        }),
        filePathForFileImported: formProperFilePath({
            delimiter,
            filePath: `${filePath}${defaultFile}`,
        }),
    };
};

const importExportWithJSExtension = ({
    files,
    node: {
        ast: { body },
        code,
        file,
    },
}: Readonly<{
    node: Node;
    files: Files;
}>): ReadonlyArray<
    WriteCode &
        Readonly<{
            replaceNodes: ReplaceNodes;
        }>
> => {
    const codeWithoutCarriageReturn = code.replace(/\r/gm, '');
    const splitted = codeWithoutCarriageReturn.split('\n');
    const statementType = Eslint.AST_NODE_TYPES;

    const replaceNodes: ReplaceNodes = body.flatMap((statement) => {
        const { type } = statement;
        switch (type) {
            case statementType.ImportDeclaration:
            case statementType.ExportAllDeclaration:
            case statementType.ExportNamedDeclaration: {
                const { source } = statement;
                if (!source) {
                    return [];
                } else {
                    const {
                        value,
                        loc: { end },
                    } = source;
                    const delimiter = '/';
                    const fileName = formProperFilePath({
                        delimiter,
                        filePath: !value.endsWith(delimiter)
                            ? value
                            : value.slice(0, -1),
                    })
                        .split(delimiter)
                        .pop();
                    if (!fileName) {
                        throw new Error(
                            `Impossible for file name to be non-existent for ${value}`
                        );
                    }
                    if (!value.startsWith('.')) {
                        return [];
                    } else {
                        const result = addJSExtension({
                            delimiter,
                            importPath: value,
                            filePath: path.join(file, '..', value),
                        });

                        switch (result.type) {
                            case 'skip':
                                return [];
                            case 'proceed': {
                                // if file name not included in list of js file read
                                const { filePathForFileImported, importPath } =
                                    result;
                                const fileFound = files.find((file) =>
                                    file.endsWith(filePathForFileImported)
                                );
                                if (!fileFound) {
                                    return [];
                                }

                                const before = splitted[end.line - 1];
                                if (!before) {
                                    throw new Error(
                                        `Old Code: ${before} is undefined`
                                    );
                                }
                                return [
                                    {
                                        before,
                                        after: before.replace(
                                            value,
                                            importPath
                                        ),
                                    },
                                ];
                            }
                        }
                    }
                }
            }
            default:
                return [];
        }
    });
    return [
        {
            file,
            replaceNodes,
            code: !replaceNodes.length
                ? codeWithoutCarriageReturn
                : replaceNodes.reduce(
                      (prev, { before, after }) => prev.replace(before, after),
                      codeWithoutCarriageReturn
                  ),
        },
    ];
};

const tabulateChanges = (
    changes: ReadonlyArray<{
        replaceNodes: ReplaceNodes;
        file: string;
    }>
) => {
    const table = new Table({
        columns: [
            { name: 'index', alignment: 'left' },
            { name: 'file', alignment: 'left' },
            { name: 'before', alignment: 'left' },
            { name: 'after', alignment: 'left' },
        ],
    });
    table.table.title = 'The Output of ts-add-js-extension';
    changes.forEach(({ replaceNodes, file }, changeIndex) =>
        replaceNodes.forEach(({ before, after }, index) => {
            const currentIndex = index + 1;
            table.addRow(
                {
                    file,
                    before,
                    after,
                    index:
                        changes
                            .map((change, index) =>
                                index >= changeIndex
                                    ? 0
                                    : change.replaceNodes.length
                            )
                            .reduce((prev, curr) => prev + curr) + currentIndex,
                },
                { color: 'cyan' }
            );
        })
    );
    table.printTable();
};

const postProcess = async ({
    dir,
    shouldLog,
    showChanges,
    withJSExtension,
}: Readonly<{
    dir: Dir;
    shouldLog: boolean;
    showChanges: boolean;
    withJSExtension: ReturnType<typeof importExportWithJSExtension>;
}>) => {
    await Promise.all(
        withJSExtension.map(({ code, file }) =>
            fs.writeFile(file, code, (err) => {
                if (err) {
                    console.error(err);
                }
            })
        )
    );
    if (showChanges) {
        tabulateChanges(
            withJSExtension.map(({ replaceNodes, file }) => ({
                file,
                replaceNodes: replaceNodes.flat(),
            }))
        );
    }
    if (withJSExtension.length && shouldLog && dir) {
        console.log(
            'Completed adding .js extension to each relative import/export statement'
        );
    }
};

const preProcess = ({
    dir,
    shouldLog,
}: Readonly<{
    dir: Dir;
    shouldLog: boolean;
}>) => {
    const files = getAllJavaScriptFiles(dir);
    if (shouldLog && !files.length) {
        console.log(
            `No files with .js extension was found in the specified folder of ${dir}. If this behavior is unexpected, Please file an issue, your feedback is greatly appreciated. Adios...`
        );
    }
    if (shouldLog && dir) {
        console.log(
            'Adding .js extension to each relative import/export. Please be patient...'
        );
    }
    return files;
};

const midProcess = async ({
    files,
    include,
}: Readonly<{
    include: ReadonlyArray<string>;
    files: ReturnType<typeof getAllJavaScriptFiles>;
}>) => {
    // user may import files from `common` into `src`
    const allIncludedFiles: Files = files.concat(
        include.flatMap(getAllJavaScriptFiles)
    );
    return (
        await getAllJavaScriptCodes(files).reduce(
            async (prev, curr) => (await prev).concat(await curr),
            Promise.resolve([] as ReadonlyArray<Node>)
        )
    ).flatMap((node) =>
        importExportWithJSExtension({
            node,
            files: allIncludedFiles,
        })
    );
};

type Argv = Parameters<
    Parameters<ReturnType<typeof yargs>['command']>[0]['handler']
>[0];

type ParsedConfig = Readonly<{
    dir: string;
    showChanges?: boolean;
    include?: ReadonlyArray<string>;
}>;

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
        showChanges: config.showChanges ?? false,
        include: config.include ?? [],
    } as const);

const tsAddJsExtension = async (parsedConfig: ParsedConfig) => {
    const config = finalizedConfig(parsedConfig);
    const shouldLog = process.env.TS_ADD_JS_EXTENSION_NODE_ENV !== 'test';
    return postProcess({
        shouldLog,
        dir: config.dir,
        showChanges: config.showChanges,
        withJSExtension: await midProcess({
            include: config.include,
            files: preProcess({
                shouldLog,
                dir: config.dir,
            }),
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
                tsAddJsExtension(parseConfig(argv))
                    .then((result) => {
                        switch (result.type) {
                            case 'error':
                                console.dir(
                                    {
                                        error: result.error,
                                    },
                                    { depth: null }
                                );
                        }
                    })
                    .catch((error) => console.dir({ error }, { depth: null }));
            },
        })
        .example(
            "Assume javascript files are placed in folder called 'build'\nThe command will be as below\n$0 add --dir=dist --include=common dist build --showchanges=true",
            `.
            1. "dir" stands for the directory of that needs to add .js extension. (string)
            2. "include" stands for the directory of files that is imported or included in 'dir' folder, exclusing the 'dir' specified. (array)
            3. "showchanges" determines whether to show the changes made to import/export in table format. (boolean)
            `
        )
        .help()
        .strict().argv;
};

export { parseConfig, tsAddJsExtension };
export default main;
