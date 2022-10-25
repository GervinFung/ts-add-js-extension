import * as Eslint from '@typescript-eslint/typescript-estree';
import fs from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Table } from 'console-table-printer';
import path from 'path';
import showProgress from './progress';

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
            .on('data', (data) => (fetchData = data.toString()))
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
    extension,
    delimiter,
    importPath,
}: Readonly<{
    filePath: string;
    importPath: string;
    delimiter: string;
    extension: ParsedConfig['extension'];
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
    const isJavaScript = !isDirectory && path.extname(filePath) === extension;
    if (isJavaScript) {
        return {
            type: 'skip',
        };
    }
    const defaultFile = `${!isDirectory ? '' : '/index'}.${extension}`;
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
    extension,
    allIncludedFiles,
    node: {
        code,
        file,
        ast: { body },
    },
}: Readonly<{
    node: Node;
    allIncludedFiles: Files;
    extension: ParsedConfig['extension'];
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
                            extension,
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
                                const fileFound = allIncludedFiles.find(
                                    (file) =>
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

    return !replaceNodes.length
        ? []
        : [
              {
                  file,
                  replaceNodes,
                  code: replaceNodes.reduce(
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
    shouldLog,
    showChanges,
    withJSExtension,
}: Readonly<{
    shouldLog: boolean;
    showChanges: boolean;
    withJSExtension: ReturnType<typeof importExportWithJSExtension>;
}>) => {
    if (withJSExtension.length && shouldLog) {
        console.log('Adding .js extension to each relative import/export\n');
    }

    withJSExtension.forEach(({ code, file }, index) =>
        fs.writeFile(file, code, (err) => {
            if (err) {
                console.error(err);
            }
            showProgress({
                index: index + 1,
                numberOfFiles: withJSExtension.length,
            });
        })
    );

    if (withJSExtension.length && showChanges) {
        return;
        tabulateChanges(
            withJSExtension.map(({ replaceNodes, file }) => ({
                file,
                replaceNodes: replaceNodes.flat(),
            }))
        );
    }

    if (withJSExtension.length && shouldLog) {
        console.log(
            'Completed adding .js extension to each relative import/export statement'
        );
    }
};

const preProcess = ({
    dir,
}: Readonly<{
    dir: Dir;
}>) => getAllJavaScriptFiles(dir);

const midProcess = async ({
    files,
    include,
    extension,
}: Readonly<{
    include: ReadonlyArray<string>;
    extension: ParsedConfig['extension'];
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
            extension,
            allIncludedFiles,
        })
    );
};

type Argv = Parameters<
    Parameters<ReturnType<typeof yargs>['command']>[0]['handler']
>[0];

type ParsedConfig = Readonly<{
    dir: string;
    extension: 'js' | 'cjs' | 'mjs';
    showChanges?: boolean;
    include?: ReadonlyArray<string>;
}>;

const parseConfig = (argv: Argv): ParsedConfig => {
    const include = argv['include'];

    const parseExtension = (extension: unknown) => {
        switch (extension) {
            case 'js':
            case 'cjs':
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
        showChanges: config.showChanges ?? false,
        include: config.include ?? [],
    } as const);

const tsAddJsExtension = async (parsedConfig: ParsedConfig) => {
    const config = finalizedConfig(parsedConfig);
    return postProcess({
        showChanges: config.showChanges,
        shouldLog: process.env.TS_ADD_JS_EXTENSION_NODE_ENV !== 'test',
        withJSExtension: await midProcess({
            include: config.include,
            extension: config.extension,
            files: preProcess({
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
                extension: {
                    default: 'js',
                    type: 'string',
                    demandOption: false,
                    describe:
                        'Valid JavaScript file extension to append to each relative import/export, i.e. `mjs`, `cjs` or `js`',
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
