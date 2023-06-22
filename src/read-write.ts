import fs from 'fs';
import ts from 'typescript';
import type { PartialConfig } from './cli-command-parser';
import traverseAndUpdateFileWithJSExtension from './traverse-and-update';
import { extensionsUtil } from './const';
import Log from './log';

type SourceFile = Awaited<ReturnType<typeof getAllJSAndDTSCodes>[0]>;

type Files = ReadonlyArray<string>;

const getAllJSAndDTSFiles = (dir: string): Files =>
    fs.readdirSync(dir).flatMap((file) => {
        const filePath = `${dir}/${file}`;
        if (fs.statSync(filePath).isDirectory()) {
            return getAllJSAndDTSFiles(filePath);
        }
        return !extensionsUtil().matchAny(filePath) ? [] : [filePath];
    });

const readCode = (files: string): Promise<string> =>
    new Promise((resolve, reject) => {
        let fetchData = '';
        fs.createReadStream(files)
            .on('data', (data) => (fetchData = data.toString()))
            .on('end', () => resolve(fetchData))
            .on('error', reject);
    });

const getAllJSAndDTSCodes = (files: Files) =>
    files.map(async (file) =>
        ts.createSourceFile(file, await readCode(file), ts.ScriptTarget.ESNext)
    );

export default class File {
    private constructor() {}

    static readonly create = () => new this();

    readonly findMany = async ({
        dir,
        include,
    }: Readonly<{
        dir: PartialConfig['dir'];
        include: ReadonlyArray<string>;
    }>) => {
        // user may import files from `common` into `src`
        const files: Files = include.concat(dir).flatMap(getAllJSAndDTSFiles);

        return (await Promise.all(getAllJSAndDTSCodes(files))).flatMap(
            traverseAndUpdateFileWithJSExtension(files)
        );
    };

    readonly writeMany = async ({
        showChanges,
        withJSExtension,
    }: Readonly<{
        showChanges: boolean;
        withJSExtension: ReturnType<
            ReturnType<typeof traverseAndUpdateFileWithJSExtension>
        >;
    }>) => {
        const repeat = withJSExtension.reduce(
            (longestFileName, { file }) =>
                longestFileName?.length <= file.length ? file : longestFileName,
            ''
        ).length;

        const log = !(withJSExtension.length && showChanges)
            ? undefined
            : Log.fromNumberOfFiles(withJSExtension.length);

        try {
            const errors = (
                await Promise.all(
                    withJSExtension.map(
                        ({ code, file }) =>
                            new Promise<
                                | undefined
                                | Readonly<{
                                      file: string;
                                      error: NodeJS.ErrnoException;
                                  }>
                            >((resolve) =>
                                fs.writeFile(file, code, (error) => {
                                    log?.increment({
                                        repeat,
                                        file,
                                        succeed: !error,
                                    });

                                    resolve(
                                        !error
                                            ? undefined
                                            : {
                                                  file,
                                                  error,
                                              }
                                    );
                                })
                            )
                    )
                )
            ).flatMap((element) => (!element ? [] : [element]));

            log?.end({ errors });

            return {
                type: 'done',
            } as const;
        } catch (error) {
            return {
                type: 'error',
                error,
            } as const;
        }
    };
}

export type { SourceFile, Files };
