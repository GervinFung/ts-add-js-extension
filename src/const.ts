const extensionsUtil = () => {
    const extensions = {
        js: '.js',
        mjs: '.mjs',
        dts: '.d.ts',
    } as const;

    const arrayfyExtensions = Object.values(extensions);

    return {
        extensions,
        matchAnyJs: (filePath: string) =>
            Boolean(
                arrayfyExtensions
                    .filter((extension) => extension !== '.d.ts')
                    .find((extension) => filePath.endsWith(extension))
            ),
        matchAny: (filePath: string) =>
            Boolean(
                arrayfyExtensions.find((extension) =>
                    filePath.endsWith(extension)
                )
            ),
    } as const;
};

const separator = '/';

export { extensionsUtil, separator };
