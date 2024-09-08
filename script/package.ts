import fs from 'fs';

import pkg from '../package.json';

const main = () => {
	fs.writeFileSync(
		'src/package.ts',
		`
const pkg = {
    name: "${pkg.name}",
    version: "${pkg.version}"
} as const

export default pkg
`
	);
};

main();
