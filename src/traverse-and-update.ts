import fs from 'fs';
import path from 'path';
import { Node, Files, WriteCode } from './read-write';
import * as Estree from '@typescript-eslint/typescript-estree';
import { extensionsUtil } from './const';

type AddJSNode = Readonly<{
    before: string;
    after: string;
}>;

type ReplaceNodes = ReadonlyArray<AddJSNode>;

const formProperFilePath = ({
    delimiter,
    filePath,
}: Readonly<{
    delimiter: string;
    filePath: string;
}>) => filePath.split(delimiter).filter(Boolean).join(delimiter);

const checkJavaScriptFileExistByAppend = ({
    filePath,
}: Readonly<{
    filePath: string;
}>) => {
    const { js, mjs } = extensionsUtil.extensions;
    const jsFile = filePath.concat(js);
    if (fs.existsSync(jsFile)) {
        return js;
    }
    const mjsFile = filePath.concat(mjs);
    if (fs.existsSync(mjsFile)) {
        return mjs;
    }
    return false;
};

const isDirectory = (filePath: string) => {
    try {
        return fs.lstatSync(filePath).isDirectory();
    } catch (error) {
        return false;
    }
};

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
          procedure: 'skip';
      }
    | {
          procedure: 'proceed';
          importPath: string;
          filePathImported: string;
      }
> => {
    const { js, mjs } = extensionsUtil.extensions;

    const jsExtension = path.extname(filePath);
    const isJavaScript = jsExtension === js || jsExtension === mjs;
    if (isJavaScript) {
        return {
            procedure: 'skip',
        };
    }
    if (!isDirectory(filePath)) {
        const extension = checkJavaScriptFileExistByAppend({
            filePath: `${filePath}`,
        });
        if (!extension) {
            return {
                procedure: 'skip',
            };
        }
        return {
            procedure: 'proceed',
            importPath: formProperFilePath({
                delimiter,
                filePath: `${importPath}${extension}`,
            }),
            filePathImported: formProperFilePath({
                delimiter,
                filePath: `${filePath}${extension}`,
            }),
        };
    }
    const extension = checkJavaScriptFileExistByAppend({
        filePath: `${filePath}/index`,
    });
    return {
        procedure: 'proceed',
        importPath: formProperFilePath({
            delimiter,
            filePath: `${importPath}/index${extension}`,
        }),
        filePathImported: formProperFilePath({
            delimiter,
            filePath: `${filePath}/index${extension}`,
        }),
    };
};

const traverseAndUpdateFileWithJSExtension = ({
    files,
    node: {
        code,
        file,
        ast: { body },
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
    const statementType = Estree.AST_NODE_TYPES;

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

                        switch (result.procedure) {
                            case 'skip': {
                                return [];
                            }
                            case 'proceed': {
                                // if file name not included in list of js file read
                                const { filePathImported, importPath } = result;
                                const fileFound = files.find((file) =>
                                    file.endsWith(filePathImported)
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
        }
        return [];
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

export default traverseAndUpdateFileWithJSExtension;
