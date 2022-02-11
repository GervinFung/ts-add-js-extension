# **ts-add-js-extension**

Meant for typescript projects only. It add .js extension to each relative import and export when you compile typescript to ESNext Module.

 **Note**:
 I removed custom minification as there are better minification than what I wrote. I thought it would be good to add custom minification, but I was wrong, if any of you faced difficulties while using this package, I apologize.
 
 This package will only work if the import contain file name in the import or export statement.

 For example, assume that you have a file named `index.ts` inside a math folder, it's possible to not include `/index` in your import statement

 As such, this package work for the following code because the file it imported is `index.ts`

```ts
import { add } from './math/index';
console.log(add(2, 1));
```
 However, this package won't work for the following example there's no `index.ts` file specified 

```ts
import { add } from './math';
console.log(add(2, 1));
```
 Perhaps, such functionality will be provided in the future


## **_How it works_**

### For import statement

#### In typescript file

```ts
import { add } from './math/index';
import math from './math/index';

console.log(add(2, 1) === math.add(2, 1));
```

#### will yield in compiled js files

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

#### In typescript file

```ts
export { add, sub, mul, div } from './math/index';
```

#### will yield in compiled js files

```js
export { add, sub, mul, div } from './math/index.js';
```

#### instead of

```ts
export { add, sub, mul, div } from './math/index';
```

## **_Question_**

`Why do I build this?`

Initially I wrote it only for myself because I don't like to have `.js` in my typescript import statement if I were to compile my typescript project to ESNext Module, it just feels weird although it works. Another option is to compile it to CommonJS Module, but I don't want to. Besides, it's good to learn something new as this is done with the help of AST :). Thus I can use this package for my typescript projects

`How do I raise an issue?`

Feel free to raise an issue if you have a question, an enhancement, or a bug report.

## **_How to use_**

`yarn add -D ts-add-js-extension`

OR

`npm i -D ts-add-js-extension`

### In package.json add:

Your compiled typescript folder can be named whatever you like, in this case the convention is dist

```json
"build:ts-add-js-extension": "ts-add-js-extension --dir=dist"
```
