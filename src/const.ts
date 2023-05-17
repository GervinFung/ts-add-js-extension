const extensions = {
    js: '.js',
    mjs: '.mjs',
    dts: '.d.ts',
} as const;

const extensionsUtil = new (class {
    readonly extensions = extensions;

    readonly arrayfyExtensions = Object.values(this.extensions);

    readonly matchAny = (filePath: string) =>
        Boolean(
            this.arrayfyExtensions.find((extension) =>
                filePath.endsWith(extension)
            )
        );
})();

export { extensionsUtil };
