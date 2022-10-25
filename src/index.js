const start = ({ size, index }) => {
    const percentage = Math.round((index / size) * 100);
    const line = [
        `Updating file: src/process/pgtyped/hash/${index}.ts`,
        `Total file${!size ? '' : 's'}: ${size}\tDone: ${index}\tPercentage: ${
            size === index
                ? 100
                : !((percentage * 10) % 10)
                ? percentage
                : percentage.toFixed(2)
        }\n`,
    ].join('\n');

    if (index !== 1) {
        process.stdout.moveCursor(0, -2);
        process.stdout.clearScreenDown();
    }

    process.stdout.write(line);
};

Array.from({ length: 100 }, (_, index) => {
    start({
        index: index + 1,
        size: 100,
    });
});
