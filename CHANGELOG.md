## 1.2.1 (31 July 2022)

-   (Chore) Remove `tsbuild-config` from build

## 1.2.0 (6 May 2022)

-   (Feat) Auto add `/index.js` for import/export statement as we can omit `index` at the end of import/export
-   (Feat) Show import/export that has changed, can optionally turn it off as it's on by default

## 1.1.0 (6 May 2022)

-   (Fix) Read all javascript files to make sure relative imported file is JavaScript file before adding `.js` extension
-   (Feat) Allow import from different root folder, for example, it is possible to add `.js` extension for imported JavaScript files from `common` into `src` folder

## 1.0.2 (20 Feb 2022)

-   (Fix) Merge PR `https://github.com/P-YNPM/ts-add-js-extension/pull/2` to add `ExportAllDeclaration` to handle additional export JavaScript

## 1.0.1 (11 Feb 2022)

-   (Feat) Made write file asynchronous to speed up writing

## 1.0.0 (13 Jan 2022)

-   (Fix!) Removed minification, perform only single function -> Add .js extension to each relative import

## 0.0.5 (4 Dec 2021)

-   (Chore) Change file in bin folder to JavaScript file and changed to import, not require

## 0.0.4 (4 Dec 2021)

-   (Chore) Updated parse-dont-validate package version in package.json

## 0.0.3 (4 Dec 2021)

-   (Feat) Added main entry point

## 0.0.2 (4 Dec 2021)

-   (Feat) Added minification and remove comment option based on AST

## 0.0.1 (29 Nov 2021)

-   (Chore) Added Git URL

## 0.0.0 (29 Nov 2021)

-   (Feat) Initial public release
