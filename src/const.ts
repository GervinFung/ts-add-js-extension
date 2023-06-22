const extensionsUtil = () => {
    const extensions = {
        js: '.js',
        mjs: '.mjs',
        dts: '.d.ts',
    } as const;

    const arrayfyExtensions = Object.values(extensions);

    return {
        extensions,
        matchAny: (filePath: string) =>
            Boolean(
                arrayfyExtensions.find((extension) =>
                    filePath.endsWith(extension)
                )
            ),
    } as const;
};

export { extensionsUtil };
