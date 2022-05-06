# **ts-add-js-extension**

Initially meant for TypeScript NodeJS projects only, however if you are lazy to add `.js` extension to your JavaScript relative import, you can also use this as well.

What it does is it add `.js` extension to each relative import and export for ES Module JavaScript, so you don't have to do it yourself

**Note**:
This package will only work if the import contain file name in the import or export statement.

For example, assume that you have a file named `index.ts` inside a math folder, it's possible to not include `/index` in your import statement

However, this package only work for the following code because it needs the file name specified

```ts
import { add } from './math/index';
console.log(add(2, 1));
```

That means, this package won't work for the following example there's no `index.ts` file specified

```ts
import { add } from './math';
console.log(add(2, 1));
```

## **_How it works_**

### For import statement

#### In TypeScript / JavaScript file

```ts
import { add } from './math/index';
import math from './math/index';

console.log(add(2, 1) === math.add(2, 1));
```

#### will yield

```js
import { add } from './math/index.js';
import math from './math/index.js';

console.log(add(2, 1) === math.add(2, 1));
```

#### instead of

```ts
import { add } from './math/index';
import math from './math/index';

console.log(add(2, 1) === math.add(2, 1));
```

### For export statement

#### In TypeScript / JavaScript file

```ts
export { add, sub, mul, div } from './math/index';
export * from './math/index';
```

#### will yield

```js
export { add, sub, mul, div } from './math/index.js';
export * from './math/index.js';
```

#### instead of

```ts
export { add, sub, mul, div } from './math/index';
export * from './math/index';
```

## **_Question_**

`Why do I build this?`

Initially I wrote it only for myself because I don't like to have `.js` in my TypeScript import statement if I were to compile my TypeScript project to ESNext Module, it just feels weird although it works. Another option is to compile it to CommonJS Module, but I don't want to. Besides, it's good to learn something new as this is done with the help of AST :). Thus I can use this package for my TypeScript or JavaScript projects

`How do I raise an issue?`

Feel free to raise an issue if you have a question, an enhancement, or a bug report.

## **_How to use_**

```sh
yarn add -D ts-add-js-extension
```

OR

```sh
npm i -D ts-add-js-extension
```

There are two arugments
| Argument | Usage | Type |
| :--- | :--- | :--- |
| dir | The folder that need to add .js extension | **Required** |
| include | The folder of files that is imported or included in `dir` folder, exclusing the `dir` specified | **Optional** |

### In package.json add:

Your compiled TypeScript folder or JavaScript folder can be named whatever you like, in this case the I will name it as dist

```json
{
    "scripts": {
        "build:ts-add-js-extension": "ts-add-js-extension add --dir=dist"
    }
}
```

If you need to include various root folder, for example, `common`, `dist`, `build`, you name it

```json
{
    "scripts": {
        "build:ts-add-js-extension": "ts-add-js-extension add --dir=dist --include=common dist build"
    }
}
```
