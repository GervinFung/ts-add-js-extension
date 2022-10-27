const showProgress = ({
    index,
    numberOfFiles,
}: Readonly<{
    index: number;
    numberOfFiles: number;
}>) => {
    const percentage = Math.round((index / numberOfFiles) * 100);

    const line = [
        `Progress: total file${!numberOfFiles ? '' : 's'}: ${numberOfFiles}`,
        `done: ${index}${Array.from(
            {
                length:
                    numberOfFiles.toString().length - index.toString().length,
            },
            () => ' '
        ).join('')}`,
        `percentage: ${
            numberOfFiles === index
                ? 100
                : !((percentage * 10) % 10)
                ? percentage
                : percentage.toFixed(2)
        }\n`,
    ].join('\t');

    process.stdout.clearScreenDown();
    process.stdout.write(line);
};

export default showProgress;
