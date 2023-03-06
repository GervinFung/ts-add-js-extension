import fs from 'fs';
import path from 'path';
import * as Estree from '@typescript-eslint/typescript-estree';
import { FinalizedConfig } from './config';
import traverseAndUpdateFileWithJSExtension from './traverse-and-update';
import Progress from './progress';
import { extensions } from './const';

type Node = Readonly<{
    file: string;
    code: string;
    ast: Estree.AST<
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
}: Readonly<{
    dir: string;
}>): Files =>
    fs.readdirSync(dir).flatMap((file) => {
        const filePath = `${dir}/${file}`;
        if (fs.statSync(filePath).isDirectory()) {
            return getAllJavaScriptFiles({
                dir: filePath,
            });
        }
        const extension = path.extname(filePath);
        return !(extensions.mjs === extension || extensions.js === extension)
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
            ast: Estree.parse(code, { loc: true }),
        };
    });

const file = () => ({
    findMany: async ({
        dir,
        include,
    }: Readonly<{
        dir: FinalizedConfig['dir'];
        include: ReadonlyArray<string>;
    }>) => {
        // user may import files from `common` into `src`
        const files: Files = include.concat(dir).flatMap((dir) =>
            getAllJavaScriptFiles({
                dir,
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
            })
        );
    },
    writeMany: async ({
        showChanges,
        withJSExtension,
    }: Readonly<{
        showChanges: boolean;
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

        progress?.end({ errors });
    },
});

export type { Node, Files, WriteCode };
export default file;
