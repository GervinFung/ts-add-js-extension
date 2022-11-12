import fs from 'fs';
import path from 'path';
import { FinalizedConfig } from './config';
import { Node, Files, WriteCode } from './read-write';
import * as Eslint from '@typescript-eslint/typescript-estree';

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

const addJSExtension = ({
    filePath,
    extension,
    delimiter,
    importPath,
}: Readonly<{
    filePath: string;
    importPath: string;
    delimiter: string;
    extension: FinalizedConfig['extension'];
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
    const defaultFile = `${!isDirectory ? '' : '/index'}${extension}`;
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

const traverseAndUpdateFileWithJSExtension = ({
    extension,
    files,
    node: {
        code,
        file,
        ast: { body },
    },
}: Readonly<{
    node: Node;
    files: Files;
    extension: FinalizedConfig['extension'];
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
                            case 'skip': {
                                return [];
                            }
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
