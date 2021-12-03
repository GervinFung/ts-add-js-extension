# **ts-add-js-extension**

Meant for typescript projects only. It add .js extension to each relative import when you compile typescript to ESNext Module. In addition there's an option to minify all the compiled javascript code by removing comments and inlining all the codes. I mostly use this for myself, so you might want to use a better bundler and minifier if performance and code obscureness is your concern, but if you don't mind some simple minification, you can try this out as well :)

### In typescript file

```ts
import { add } from './math';
import math from './math';

console.log(add(2, 1) === math.add(2, 1));
```

### will yield in compiled js files

```js
import { add } from './math.js';import math from './math.js';console.log(add(2, 1) === math.add(2, 1));
```

### instead of

```ts
import { add } from './math';
import math from './math';

console.log(add(2, 1) === math.add(2, 1));
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
"build:ts-add-js-extension": "ts-add-js-extension --dir=dist --minify=true --keepComments=false"
```
Of course you can choose not to minify and remove comments, you can set the values yourself
However, by default minify and keepComments is set to false and true respectively
