import fs from 'fs';

const generatePackageJson = (folder, type) =>
    fs.writeFile(
        `build/${folder}/package.json`,
        JSON.stringify({
            type,
        }),
        (err) =>
            err
                ? console.error(err)
                : console.log(`${type} package.json generated`)
    );

generatePackageJson('mjs', 'module');
generatePackageJson('cjs', 'commonjs');
