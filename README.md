# ts-add-js-extension

Originally, I created this solution for personal use due to my preference of not including the `.js` extension in TypeScript import/export statements when compiling my TypeScript project to ES Module.
This decision was motivated by the belief that it is unnecessary to import/export a JavaScript file that does not exist in the source code folder.
Importing or exporting a file that does not exist would be illogical.
In essence, a source code should not reference its own build artifacts or output file

Additionally, another option would be to compile the TypeScript project to CommonJS Module.
However, I prefer not to take that approach.
Instead, this package is designed to cater to TypeScript or JavaScript projects that use ES Module (ESM) format and do not rely on a bundler like `esbuild` or `swc`.

# Feature

Initially designed for TypeScript projects exclusively, this solution also caters to those who prefer a more convenient approach when working with JavaScript.
By automatically appending the `.js` extension to each relative import and export statement in ES Module JavaScript, you can save yourself the effort of doing it manually.
This feature is particularly beneficial for TypeScript projects that target ES Module.

Als, this decision was motivated by the belief that it is unnecessary to import/export a JavaScript file that does not exist in the source code folder.
Importing or exporting a file that does not exist would be illogical.
In essence, a source code should not reference its own build artifacts or output file

It is worth noting that this package intelligently handles import/export statements and adds `/index.js` where necessary,
allowing you to omit the explicit inclusion of index in the statement.

Additionally, it can determine whether a file with the `mjs` or `js` extension is being imported or exported

# Usage

The compiled folder for TypeScript or JavaScript can be named according to your preference. In this case, I will use the name "dist" as an example.

**Note**: For command line arguments, refer [here](#arguments)

### Declarations

#### Command line:

```json
{
	"scripts": {
		"<command name can be anything>": "ts-add-js-extension --dir=dist"
	}
}
```

#### API:

```js
tsAddJsExtension({
	dir: 'dist',
});
```

### Execution Process

Assuming you have a file called `main.ts` in the "dist" directory, the file structure would look like this:

```
dist/
  └─ main.ts
```

And `main.ts` contains the following imports and exports, where all the files are TypeScript files:

```ts
import { add } from './math';
export { add, sub, mul, div } from './math/index';

import div from './math/div';
export * as div from './math/div';

import word from './word';

console.log(add(2, 1));
```

When `ts-add-js-extension` is executed, it will generate the following code for `main.js`:

```ts
import { add } from './math/index.js';
export { add, sub, mul, div } from './math/index.js';

import div from './math/div.js';
export * as div from './math/div.js';

import word from './word/index.mjs';

console.log(add(2, 1));
```

During the process, `ts-add-js-extension` will traverse the project and analyze the file extensions of JavaScript files being imported or exported. It will then determine whether to add the `.js` or `.mjs` file extension based on the file's original extension.

This ensures that all the JavaScript files in your project have the correct file extension, enhancing compatibility and ensuring proper import/export functionality.

# Arguments

| Argument     | Usage                                                                                                        | Required | Status                                  | Default Value |
| :----------- | :----------------------------------------------------------------------------------------------------------- | :------- | --------------------------------------- | ------------- |
| dir          | Specifies the folder where JavaScript file extension needs to be added                                       | Yes      | Active                                  | None          |
| include      | Specifies the folder of files that are imported or included in the dir folder, excluding the specified dir   | No       | Deprecated                              | []            |
| showchanges  | Determines whether to display progress feedback in the format of `Num. (File Updated) - (SUCCEED or FAILED)` | No       | Deprecated (in favor of `showprogress`) | True          |
| showprogress | Determines whether to display progress feedback in the format of `Num. (File Updated) - (SUCCEED or FAILED)` | No       | Active                                  | True          |

_Please note that the status column indicates whether an argument is active or deprecated, and the default value column specifies the default value if not provided_

# Contributions

I appreciate your active participation in the development process. If you come across any bugs, have feature requests, or need clarification on any aspect of the project, please don't hesitate to open an issue.

Additionally, your contributions to the project are highly valued. If you have ideas or improvements that you would like to implement, I invite you to suggest a pull request. Simply fork the repository, make the necessary code changes, add relevant tests to ensure quality, and push your changes.

Your feedback and contributions play an essential role in making the project better, and I am grateful for your involvement. Thank you for your support and participation in the development of the project.
