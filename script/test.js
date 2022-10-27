import fs from 'fs';
import path from 'path';

const changeMjsExtension = () => {
    const dir = 'test/sample';

    fs.readdirSync(dir, { encoding: 'utf8' })
        .map((file) => {
            if (path.extname(file) === 'css') {
                return {
                    file,
                    modifiedFile: file,
                };
            }
            return {
                file,
                modifiedFile: path.format({
                    ...path.parse(file),
                    base: '',
                    ext: '.mjs',
                }),
            };
        })
        .forEach(({ file, modifiedFile }) => {
            fs.writeFileSync(
                `test/output/${modifiedFile}`,
                fs.readFileSync(`${dir}/${file}`, {
                    encoding: 'utf8',
                })
            );
        });
};

changeMjsExtension();
