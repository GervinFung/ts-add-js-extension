import fs from 'fs';
import path from 'path';
import * as Eslint from '@typescript-eslint/typescript-estree';
import { FinalizedConfig } from './config';
import traverseAndUpdateFileWithJSExtension from './traverse-and-update';
import Progress from './progress';

type Node = Readonly<{
    file: string;
    code: string;
    ast: Eslint.AST<
        Readonly<{
            loc: true;
        }>
    >;
}>;

type WriteCode = Readonly<{
    code: string;
    file: string;
}>;

type Files = ReadonlyArray<string>;

const getAllJavaScriptFiles = ({
    dir,
    extension,
}: Readonly<{
    dir: string;
    extension: FinalizedConfig['extension'];
}>): Files =>
    fs.readdirSync(dir).flatMap((file) => {
        const filePath = `${dir}/${file}`;
        return fs.statSync(filePath).isDirectory()
            ? getAllJavaScriptFiles({
                  extension,
                  dir: filePath,
              })
            : !(path.extname(filePath) === extension)
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

const file = () => ({
    findMany: async ({
        dir,
        include,
        extension,
    }: Readonly<{
        dir: FinalizedConfig['dir'];
        include: ReadonlyArray<string>;
        extension: FinalizedConfig['extension'];
    }>) => {
        // user may import files from `common` into `src`
        const files: Files = include.concat(dir).flatMap((dir) =>
            getAllJavaScriptFiles({
                dir,
                extension,
            })
        );

        return (
            await getAllJavaScriptCodes(files).reduce(
                async (prev, curr) => (await prev).concat(await curr),
                Promise.resolve([] as ReadonlyArray<Node>)
            )
        ).flatMap((node) =>
            traverseAndUpdateFileWithJSExtension({
                node,
                files,
                extension,
            })
        );
    },
    writeMany: async ({
        extension,
        showChanges,
        withJSExtension,
    }: Readonly<{
        showChanges: boolean;
        extension: FinalizedConfig['extension'];
        withJSExtension: ReturnType<
            typeof traverseAndUpdateFileWithJSExtension
        >;
    }>) => {
        const progress = !(withJSExtension.length && showChanges)
            ? undefined
            : Progress.fromNumberOfFiles(withJSExtension.length);

        const errors = (
            await Promise.all(
                withJSExtension.flatMap(
                    ({ code, file }) =>
                        new Promise<
                            | undefined
                            | Readonly<{
                                  file: string;
                                  error: NodeJS.ErrnoException;
                              }>
                        >((resolve) =>
                            fs.writeFile(file, code, (error) => {
                                progress?.incrementNumberOfFilesRan();
                                if (!error) {
                                    progress?.show(file);
                                    resolve(undefined);
                                } else {
                                    resolve({
                                        file,
                                        error,
                                    });
                                }
                            })
                        )
                )
            )
        ).flatMap((element) => (!element ? [] : [element]));

        progress?.end({ errors, extension });
    },
});

export type { Node, Files, WriteCode };
export default file;
