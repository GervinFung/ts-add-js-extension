import { AST, parse } from '@typescript-eslint/typescript-estree';
import * as fs from 'fs';

type Node = {
    readonly file: string;
    readonly code: string;
    readonly ast: AST<{
        loc: true;
    }>;
};

type ReplaceNode = {
    readonly oldCode: string;
    readonly newCode: string;
};

type WriteCode = {
    readonly code: string;
    readonly file: string;
};

// TODO - change to asynchronous
const getAllTypeScriptFiles = (dir: string): ReadonlyArray<string> =>
    fs.readdirSync(dir).flatMap((file) => {
        const path = `${dir}/${file}`;
        if (fs.statSync(path).isDirectory()) {
            return getAllTypeScriptFiles(path);
        }
        const extension = path.split('.')[1];
        return extension ? (extension === 'ts' ? [path] : []) : [];
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

const getAllTypeScriptCodes = (
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

const processTypeScriptAST = (
    { ast, code, file }: Node,
    format: boolean
): ReadonlyArray<WriteCode> => {
    const { body } = ast;
    const splitted = code.replace(/\r/g, '').split('\n');
    const replaceNodes: ReadonlyArray<ReplaceNode> = body.flatMap(
        (statement) => {
            const { type } = statement;
            switch (type) {
                case 'ImportDeclaration': {
                    const { source } = statement;
                    const {
                        value,
                        loc: { end },
                    } = source;
                    const isRelativeImport = value.charAt(0) === '.';
                    if (isRelativeImport) {
                        const oldCode = splitted[end.line - 1];
                        if (format && value.includes('.js')) {
                            throw new Error(
                                `Your typescript file: ${file} already contains .js extension for each relative import. Continue adding it will cause possible run time errors. Thus I disallowed that. Aborting...`
                            );
                        }
                        return [
                            {
                                oldCode,
                                newCode: format
                                    ? oldCode.replace(value, `${value}.js`)
                                    : oldCode.replace(
                                          value,
                                          value.replace('.js', '')
                                      ),
                            } as ReplaceNode,
                        ];
                    }
                }
            }
            return [];
        }
    );
    let copy = code;
    replaceNodes.forEach((replaceNode) => {
        const { oldCode, newCode } = replaceNode;
        copy = copy.replace(oldCode, newCode);
    });
    return replaceNodes.length ? [{ code: copy, file }] : [];
};

const main = async (dir: string, format: boolean) => {
    const files = getAllTypeScriptFiles(dir);
    const ast = await getAllTypeScriptCodes(files).reduce(
        async (prev, curr) => (await prev).concat(await curr),
        Promise.resolve([] as ReadonlyArray<Node>)
    );

    ast.flatMap((t) => processTypeScriptAST(t, format)).forEach(
        ({ code, file }) => {
            fs.writeFile(file, code, (err) => {
                if (err) {
                    console.error(err);
                }
            });
        }
    );
};

const processOption = (option: string) => {
    if (option === 'add') {
        return true;
    } else if (option === 'remove') {
        return false;
    }
    throw new Error(
        `Second arguments must be either "--add" or "--remove". You used "--${option}" instead`
    );
};

export default (args: ReadonlyArray<string>) => {
    const params: ReadonlyArray<string> = args
        .map((arg) => arg.replace(/--/g, ''))
        .slice(2);
    const length = params.length;
    if (length === 2) {
        const format = processOption(params[1]);
        console.log(
            `${
                format ? 'Adding' : 'Removing'
            } .js extension to each relative import. Please be patient...`
        );
        try {
            main(params[0], format);
        } catch {
            process.exit(1);
        }
        console.log(
            `Completed ${
                format ? 'adding' : 'removing'
            } .js extension to each relative import. It's ready for deployment...\nThank you for using me.`
        );
        return;
    } else if (length === 1) {
        throw new Error(
            'Did you forgot to add a "format" option to format each relative import in typescript?\n1. true to add .js extension\n2. false to remove .js extension'
        );
    }
    throw new Error(
        'Did you forgot to provide 2 arguments?\n1. dir: directory to read from\n2. format: to determine whether to add .js extension for each relative import in typescript'
    );
};
