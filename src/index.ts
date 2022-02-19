import { AST, parse } from '@typescript-eslint/typescript-estree';
import * as fs from 'fs';
import { parseAsString } from 'parse-dont-validate';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

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
    oldCode: string;
    newCode: string;
}>;

type WriteCode = Readonly<{
    code: string;
    file: string;
}>;

const getAllJavaScriptFiles = (dir: string): ReadonlyArray<string> =>
    fs.readdirSync(dir).flatMap((file) => {
        const path = `${dir}/${file}`;
        if (fs.statSync(path).isDirectory()) {
            return getAllJavaScriptFiles(path);
        }
        const extension = path.split('.').pop();
        return extension ? (extension === 'js' ? [path] : []) : [];
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

const getAllJavaScriptCodes = (
    files: ReadonlyArray<string>
): ReadonlyArray<Promise<Node>> =>
    files.map(async (file) => {
        const code = await readCode(file);
        return {
            file,
            code,
            ast: parse(code, { loc: true }),
        };
    });

const addExtension = ({
    ast: { body },
    code,
    file,
}: Node): ReadonlyArray<WriteCode> => {
    const codeWithoutCarriageReturn = code.replace(/\r/gm, '');
    const splitted = codeWithoutCarriageReturn.split('\n');
    const replaceNodes: ReadonlyArray<AddJSNode> = body.flatMap((statement) => {
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
                if (value.charAt(0) === '.') {
                    const oldCode = splitted[end.line - 1];
                    if (!oldCode) {
                        throw new Error(`Old Code: ${oldCode} is undefined`);
                    }
                    if (!value.includes('.js')) {
                        return [
                            {
                                oldCode,
                                newCode: oldCode.replace(value, `${value}.js`),
                            },
                        ];
                    }
                }
            }
        }
        return [];
    });
    return [
        {
            code: replaceNodes.length
                ? replaceNodes.reduce(
                      (prev, { oldCode, newCode }) =>
                          prev.replace(oldCode, newCode),
                      codeWithoutCarriageReturn
                  )
                : codeWithoutCarriageReturn,
            file,
        },
    ];
};

const main = async (dir: string) => {
    const files = getAllJavaScriptFiles(dir);
    if (files.length === 0) {
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
    await Promise.all(
        (
            await getAllJavaScriptCodes(files).reduce(
                async (prev, curr) => (await prev).concat(await curr),
                Promise.resolve([] as ReadonlyArray<Node>)
            )
        )
            .flatMap((t) => addExtension(t))
            .map(({ code, file }) =>
                fs.writeFile(file, code, (err) => {
                    if (err) {
                        console.error(err);
                    }
                })
            )
    );
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
                    describe: 'The folder that contains javascript codes',
                    demandOption: true,
                    type: 'string',
                },
            },
            handler(argv) {
                try {
                    main(parseAsString(argv['dir']).orElseThrowDefault('dir'));
                } catch {
                    process.exit(1);
                }
            },
        })
        .example(
            "Assume javascript files are placed in folder called 'build'\nThe command will be as below\n$0 add --dir=build",
            `.
            1. dir stands for the directory of the javascript code. (string)
            `
        )
        .help()
        .strict().argv;
