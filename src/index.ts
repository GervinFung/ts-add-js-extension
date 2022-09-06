import { AST, parse } from '@typescript-eslint/typescript-estree';
import * as fs from 'fs';
import {
    parseAsBoolean,
    parseAsReadonlyArray,
    parseAsString,
} from 'parse-dont-validate';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Table } from 'console-table-printer';

type Node = Readonly<{
    file: string;
    code: string;
    ast: AST<
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

const getAllJavaScriptFiles = (dir: string): Files =>
    fs.readdirSync(dir).flatMap((file) => {
        const path = `${dir}/${file}`;
        if (fs.statSync(path).isDirectory()) {
            return getAllJavaScriptFiles(path);
        }
        const extension = path.split('.').pop();
        return !extension || extension !== 'js' ? [] : [path];
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
            ast: parse(code, { loc: true }),
        };
    });

const addJSExtension = ({
    path,
    importPath,
}: Readonly<{
    path: string;
    importPath: string;
}>) => {
    const isDirectory = fs.existsSync(path) && fs.lstatSync(path).isDirectory();
    const defaultFile = `${!isDirectory ? '' : '/index'}.js`;
    return {
        filePathForFileImported: `${path}${defaultFile}`.replace('//', '/'),
        importPath: `${importPath}${defaultFile}`,
    };
};

const importExportWithJSExtension = (
    { ast: { body }, code, file }: Node,
    files: Files
): ReadonlyArray<
    WriteCode &
        Readonly<{
            replaceNodes: ReplaceNodes;
        }>
> => {
    const codeWithoutCarriageReturn = code.replace(/\r/gm, '');
    const splitted = codeWithoutCarriageReturn.split('\n');
    const replaceNodes: ReplaceNodes = body.flatMap((statement) => {
        const { type } = statement;
        switch (type) {
            case 'ExportAllDeclaration':
            case 'ExportNamedDeclaration':
            case 'ImportDeclaration': {
                const { source } = statement;
                if (!source) {
                    return [];
                }
                const {
                    value,
                    loc: { end },
                } = source;
                const fileName = value.split('/').pop();
                if (!fileName) {
                    throw new Error(
                        `Impossible for file name to be non-existent for ${value}`
                    );
                }
                if (value.charAt(0) !== '.') {
                    return [];
                }
                const removeRelativeImportCount = value.startsWith('./')
                    ? 1
                    : value.split('../').length;
                const pathToReplaceRelativeImport = file
                    .split('/')
                    .slice(0, removeRelativeImportCount * -1)
                    .join('/');
                const { filePathForFileImported, importPath } = addJSExtension({
                    importPath: value,
                    path: `${pathToReplaceRelativeImport}/${value
                        .split('/')
                        .filter((val) => val !== '..' && val !== '.')
                        .join('/')}`,
                });
                // if file name not included in list of js file read
                const fileFound = files.find(
                    (file) => file === filePathForFileImported
                );
                if (!fileFound) {
                    return [];
                }
                const before = splitted[end.line - 1];
                if (!before) {
                    throw new Error(`Old Code: ${before} is undefined`);
                }
                if (!value.includes('.js')) {
                    return [
                        {
                            before,
                            after: before.replace(value, importPath),
                        },
                    ];
                }
            }
        }
        return [];
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
                    index:
                        changes
                            .map((change, index) =>
                                index >= changeIndex
                                    ? 0
                                    : change.replaceNodes.length
                            )
                            .reduce((prev, curr) => prev + curr) + currentIndex,
                    file,
                    before,
                    after,
                },
                { color: 'cyan' }
            );
        })
    );
    table.printTable();
};

const main = async ({
    dir,
    include,
    showChanges,
}: Readonly<{
    dir: string;
    include: ReadonlyArray<string>;
    showChanges: boolean;
}>) => {
    const files = getAllJavaScriptFiles(dir);
    if (!files.length) {
        console.log(
            `No files with .js extension was found in the specified folder of ${dir}. If this behavior is unexpected, Please file an issue, your feedback is greatly appreciated. Adios...`
        );
        process.exit(0);
    }
    if (dir) {
        console.log(
            'Adding .js extension to each relative import/export. Please be patient...'
        );
    }
    // user may import files from `common` into `src`
    const allIncludedFiles: Files = files.concat(
        include.flatMap(getAllJavaScriptFiles)
    );
    const withJSExtension = (
        await getAllJavaScriptCodes(files).reduce(
            async (prev, curr) => (await prev).concat(await curr),
            Promise.resolve([] as ReadonlyArray<Node>)
        )
    ).flatMap((t) => importExportWithJSExtension(t, allIncludedFiles));
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
                replaceNodes: replaceNodes.flat(),
                file,
            }))
        );
    }
    if (dir) {
        console.log('Completed adding .js extension to each relative import');
    }
    console.log("It's done...\nThank you for using me! Have a wonderful day!");
};

export default (args: Array<string>) =>
    yargs(hideBin(args))
        .usage(
            'Use to add .js extension for the relative imports in the javascript code if there is lack of .js extension in the import.'
        )
        .command({
            command: 'add',
            describe:
                'Use to add .js extension for the relative imports in the javascript code if there is lack of .js extension in the import.',
            builder: {
                dir: {
                    describe: 'The folder that need to add .js extension',
                    demandOption: true,
                    type: 'string',
                },
                include: {
                    describe:
                        'The folder of files that is imported or included in `dir` folder, exclusing the `dir` specified',
                    demandOption: false,
                    type: 'array',
                },
                showchanges: {
                    describe:
                        'Show changes made to import/export declaration in table format',
                    demandOption: false,
                    default: true,
                    type: 'boolean',
                },
            },
            handler: (argv) => {
                try {
                    main({
                        dir: parseAsString(argv['dir']).orElseThrowDefault(
                            'dir'
                        ),
                        include: parseAsReadonlyArray(argv['include'], (dir) =>
                            parseAsString(dir).orElseThrowDefault(`dir: ${dir}`)
                        ).orElseGetReadonlyEmptyArray(),
                        showChanges: parseAsBoolean(
                            argv['showchanges']
                        ).orElseGetTrue(),
                    });
                } catch {
                    process.exit(1);
                }
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
