import * as fs from 'fs';
const p = './node_modules/node-package-helper/build/tally-transpiled-files.js';

const result = fs.readFileSync(p, 'utf8').replace('`${dir}/${type}`','path.join(dir, type)');
fs.writeFileSync(p, result);
