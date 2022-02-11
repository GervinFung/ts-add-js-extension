import { parse } from '@typescript-eslint/typescript-estree';
import * as fs from 'fs';
import { parseAsBoolean, parseAsString } from 'parse-dont-validate';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import s from "../s";
import s from '../s';
console.log(s);
const getAllJavaScriptFiles = (dir) =>
    fs.readdirSync(dir).flatMap((file) => {
        const path = `${dir}/${file}`;
        if (fs.statSync(path).isDirectory()) {
            return getAllJavaScriptFiles(path);
        }
        const extension = path.split('.').pop();
        return extension ? (extension === 'js' ? [path] : []) : [];
    });
const readCode = (files) =>
    new Promise((resolve, reject) => {
        let fetchData = '';
        fs.createReadStream(files)
            .on('data', (data) => {
                fetchData = data.toString();
            })
            .on('end', () => resolve(fetchData))
            .on('error', reject);
    });
const getAllJavaScriptCodes = (files, keepComments) =>
    files.map(async (file) => {
        const code = await readCode(file);
        return {
            file,
            code,
            ast: parse(code, { loc: true, comment: keepComments }),
        };
    });
const getCodeSnippet = (length, startLine, splitted, option) => {
    const code = Array.from({ length })
        .map((_, index) => {
            const i = index + startLine - 1;
            const codeSnippet = splitted[i];
            // console.log({ line: i + 1, codeSnippet });
            if (codeSnippet === undefined) {
                throw new Error(`Code Snippet is undefined at index: ${i}`);
            }
            if (option) {
                const { addExtension } = option;
                return addExtension
                    ? codeSnippet
                          .replace(addExtension.oldCode, addExtension.newCode)
                          .trim()
                    : codeSnippet.trim();
            }
            return codeSnippet.trim();
        })
        .join('');
    return {
        code,
        startLine,
    };
};
const processComments = (type, value) => {
    switch (type) {
        case 'Line':
            return `//${value}`;
        case 'Block':
            return `/*${value}*/`;
    }
};
const minifySourceCodeText = ({ ast, code, file }, keepComments) => {
    const { body, comments } = ast;
    const codeWithoutCarriageReturn = code.replace(/\r/g, '');
    const splitted = codeWithoutCarriageReturn.split('\n');
    if (comments) {
        comments.forEach((comment) => {
            console.dir(comment);
        });
    }
    const sourceCode = body.map((statement) => {
        const {
            type,
            loc: {
                end: { line: endLine },
                start: { line: startLine },
            },
        } = statement;
        switch (type) {
            case 'ImportDeclaration': {
                const { source } = statement;
                const {
                    value,
                    loc: { end },
                } = source;
                if (value.charAt(0) === '.') {
                    const oldCode = splitted[end.line - 1];
                    if (!oldCode) {
                        throw new Error(`Old Code: ${oldCode} is undefined`);
                    }
                    return getCodeSnippet(
                        endLine - startLine + 1,
                        startLine,
                        splitted,
                        value.includes('.js')
                            ? undefined
                            : {
                                  addExtension: {
                                      oldCode,
                                      newCode: oldCode.replace(
                                          value,
                                          `${value}.js`
                                      ),
                                  },
                              }
                    );
                }
            }
        }
        return getCodeSnippet(endLine - startLine + 1, startLine, splitted);
    });
    if (!keepComments) {
        return [
            {
                code: sourceCode.map((p) => p.code).join(''),
                file,
            },
        ];
    }
    const sourceCodeWithComments = (comments ? comments : [])
        .reduce((prev, comment) => {
            const {
                type,
                value,
                loc: {
                    start: { line },
                },
            } = comment;
            let found = false;
            return prev.reduce((prev, p, index, arr) => {
                if (p.startLine > line && !found) {
                    found = true;
                    const last = prev[prev.length - 1];
                    if (last === undefined) {
                        throw new Error(
                            'last item of accummulated source code cannot be undefined'
                        );
                    }
                    return prev.concat([
                        {
                            code:
                                last.code.charAt(last.code.length - 1) === '\n'
                                    ? `${processComments(type, value)}\n`
                                    : `\n${processComments(type, value)}\n`,
                            startLine: line,
                        },
                        p,
                    ]);
                }
                if (index === arr.length - 1 && !found) {
                    return prev.concat([
                        {
                            code: `\n${processComments(type, value)}\n`,
                            startLine: line,
                        },
                        p,
                    ]);
                }
                return prev.concat(p);
            }, []);
        }, sourceCode)
        .map((p) => p.code)
        .join('');
    return [
        {
            code: sourceCodeWithComments,
            file,
        },
    ];
};
const findLackOfJSExtension = ({ ast, code, file }, keepComments) => {
    const { body, comments } = ast;
    const codeWithoutCarriageReturn = code.replace(/\r/g, '');
    const splitted = codeWithoutCarriageReturn.split('\n');
    const replaceNodes = body.flatMap((statement) => {
        const { type } = statement;
        switch (type) {
            case 'ImportDeclaration': {
                const { source } = statement;
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
    const newCode = replaceNodes.length
        ? replaceNodes.reduce(
              (prev, { oldCode, newCode }) => prev.replace(oldCode, newCode),
              codeWithoutCarriageReturn
          )
        : codeWithoutCarriageReturn;
    if (keepComments) {
        return replaceNodes.length ? [{ code: newCode, file }] : [];
    }
    const replaceComments = (comments ? comments : []).map(({ type, value }) =>
        processComments(type, value)
    );
    const newCodeWithoutComments = replaceComments.reduce(
        (prev, curr) => prev.replace(curr, ''),
        newCode
    );
    return [{ code: newCodeWithoutComments, file }];
};
const main = async (dir, { minify, keepComments }) => {
    const files = getAllJavaScriptFiles(dir);
    if (files.length === 0) {
        console.log(
            `No files with .js extension was found in the specified folder of ${dir}. If this behavior is unexpected, Please file an issue, your feedback is greatly appreciated. Adios...`
        );
        process.exit(0);
    }
    if (dir) {
        console.log(
            'Adding .js extension to each relative import. Please be patient...'
        );
    }
    if (minify) {
        console.log('Minifying all JavaScript code. Please be patient...');
    }
    if (!keepComments) {
        console.log('Removing all JavaScript comments. Please be patient...');
    }
    if (minify) {
        const ast = await getAllJavaScriptCodes(files, keepComments).reduce(
            async (prev, curr) => (await prev).concat(await curr),
            Promise.resolve([])
        );
        ast.flatMap((t) => minifySourceCodeText(t, keepComments)).forEach(
            ({ code, file }) => {
                fs.writeFile(file, code, (err) => {
                    if (err) {
                        console.error(err);
                    }
                });
            }
        );
    } else {
        const ast = await getAllJavaScriptCodes(files, !keepComments).reduce(
            async (prev, curr) => (await prev).concat(await curr),
            Promise.resolve([])
        );
        ast.flatMap((t) => findLackOfJSExtension(t, keepComments)).forEach(
            ({ code, file }) => {
                fs.writeFile(file, code, (err) => {
                    if (err) {
                        console.error(err);
                    }
                });
            }
        );
    }
    if (dir) {
        console.log('Completed adding .js extension to each relative import');
    }
    if (minify) {
        console.log('Completed minifying all JavaScript code');
    }
    if (!keepComments) {
        console.log('Completed removal of all JavaScript comments');
    }
    console.log("It's done...\nThank you for using me! Have a wonderful day!");
};
export default (args) =>
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
                minify: {
                    describe:
                        'Determine whether to minify the javascript codes (default to false)',
                    type: 'boolean',
                    default: false,
                },
                keepComments: {
                    describe:
                        'Determine whether to remove the javascript comments (default to true)',
                    type: 'boolean',
                    default: true,
                },
            },
            handler(argv) {
                const dir = parseAsString(argv['dir']).orElseThrowDefault(
                    'dir'
                );
                const minify = parseAsBoolean(
                    argv['minify']
                ).orElseThrowDefault('minify');
                const keepComments = parseAsBoolean(
                    argv['keepComments']
                ).orElseThrowDefault('keepComments');
                try {
                    main(dir, { minify, keepComments });
                } catch {
                    process.exit(1);
                }
            },
        })
        .example(
            "Assume javascript files are placed in folder called 'build'\nThe command will be as below\n$0 add --dir=build --minify=true",
            `.
            1. dir stands for the directory of the javascript code. (string)
            2. minify stands for whether to minify the javascript code. (boolean)
            3. keepComments stands for whether to remove all the comments in javascript code. (boolean)
            \n
            ***
            By default minify is false and keepComments is set to true
            ***
            `
        )
        .help()
        .strict().argv;
//# sourceMappingURL=index.js.map
