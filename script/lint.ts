import { ESLint } from 'eslint';

const main = async () => {
    try {
        const eslint = new ESLint();

        const results = await eslint.lintFiles(['src', 'test']);

        const formatter = await eslint.loadFormatter('stylish');

        const resultText = await formatter.format(results);

        console.log(resultText || 'All Good');
    } catch (error) {
        console.error(error);
    }
};

main();
