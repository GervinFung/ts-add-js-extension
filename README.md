### In typescript file

```ts
import add from 'math';
```

### will yield in compiled js files

```js
import add from 'math.js';
```

### instead of

```ts
import add from 'math';
```

### This is a NPM Package meant for `PoolOfDeath20` only

### **_Please_** do not install it.

### **Unless** you are compiling typescript into javascript with the same tsconfig.json

### And would like to add `.js` extension in the import of build folder

## **_Question_**

`Why do I wanna use this?`

I don't like to have `.js` in my typescript import statement if I were to compile it to ESNEXT module, it just feels weird although it works. Besides, it's good to learn something new as this is done with the help of AST :)

## **_How to use_**

`yarn add -D ts-add-js-extension`

OR

`npm i -D ts-add-js-extension`

### In package.json add:

```json
"ts-add-js-extension": "ts-add-js-extension --"\your ts folder to compile"\ --add"
"remove-js-extension": "ts-add-js-extension --"\your ts folder to compile"\ --remove"
"build": "yarn add && "\your build command"\ && yarn remove
```

OR

```json
"ts-add-js-extension": "ts-add-js-extension --"\your ts folder to compile"\ --add"
"remove-js-extension": "ts-add-js-extension --"\your ts folder to compile"\ --remove"
"build": "npm run add && "\your build command"\ && npm run remove
```
