# **ts-add-js-extension**

Initially designed for TypeScript projects exclusively, this solution also caters to those who prefer a more convenient approach when working with JavaScript.
By automatically appending the `.js` or `.mjs` extension to each relative import and export statement in ES Module JavaScript, you can save yourself the effort of doing it manually.
This feature is particularly beneficial for TypeScript projects that target ES Module.

It is worth noting that this package intelligently handles import/export statements and adds `/index.js` where necessary,
allowing you to omit the explicit inclusion of index in the statement.

Additionally, it can determine whether a file with the mjs or js extension is being imported or exported

#### In TypeScript / JavaScript file

```ts
import { add } from './math/index.ts';
export { add, sub, mul, div } from './math/index.ts';

import div from './math/div.ts';
export * as div from './math/div.ts';

import word from './word/index.mts';

console.log(add(2, 1));
```

#### Will yield

```ts
import { add } from './math/index.js';
export { add, sub, mul, div } from './math/index.js';

import div from './math/div.js';
export * as div from './math/div.js';

import word from './word/index.mjs';

console.log(add(2, 1));
```

## **_Question_**

`Why do I build this?`

Originally, I created this solution for personal use due to my preference of not including the `.js` extension in TypeScript import/export statements when compiling my TypeScript project to ES Module.
This decision was motivated by the belief that it is unnecessary to import/export a JavaScript file that does not exist in the source code folder.
Importing or exporting a file that does not exist would be illogical.
In essence, a source code should not reference its own build artifacts or output file

Additionally, another option would be to compile the TypeScript project to CommonJS Module.
However, I prefer not to take that approach.
Instead, this package is designed to cater to TypeScript or JavaScript projects that use ES Module (ESM) format and do not rely on a bundler like `esbuild` or `swc`.

`How do I raise an issue?`

I encourage you to actively participate in the development process by opening issues for bug reports, feature requests, or any questions you may have.
You are also welcome to contribute to the project by suggesting a pull request.
Simply fork the repository, make the necessary code changes, add relevant tests, and push your changes.
We appreciate any feedback you provide and value your contributions to the project

## Arguments

| Argument    | Usage                                                                                                        | Required | Status     | Default Value |
| :---------- | :----------------------------------------------------------------------------------------------------------- | :------- | ---------- | ------------- |
| dir         | Specifies the folder where JavaScript file extension needs to be added                                       | Yes      | Active     | None          |
| include     | Specifies the folder of files that are imported or included in the dir folder, excluding the specified dir   | No       | Deprecated | []            |
| showchanges | Determines whether to display progress feedback in the format of `Num. (File Updated) - (SUCCEED or FAILED)` | No       | Active     | True          |

_Please note that the status column indicates whether an argument is active or deprecated, and the default value column specifies the default value if not provided_

## Usage

### In package.json add:

The compiled folder for TypeScript or JavaScript can be named according to your preference. In this case, I will use the name "dist" as an example.

### Command line:

```json
{
    "scripts": {
        "<command name can be anything>": "ts-add-js-extension --dir=dist"
    }
}
```

### API:

```js
tsAddJsExtension({
    dir: 'dist',
});
```

If you need to include multiple root folders, such as "common", "dist", "build", or any other names you prefer, you can specify them accordingly.

### Command line:

```json
{
    "scripts": {
        "<command name can be anything>": "ts-add-js-extension add --dir=dist --include=common dist build --showchanges=true"
    }
}
```

### API:

```js
tsAddJsExtension({
    dir: 'dist',
    showProgress: true,
    include: ['common', 'dist', 'build'],
});
```
