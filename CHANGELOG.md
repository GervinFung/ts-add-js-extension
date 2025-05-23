# 1.6.6 (22 May 2025)

- (Fix) deprecate `showchanges` and replace with `showprogress` argument in both CLI and API
- (Fix) deprecate `include` argument in both CLI and API
- (Fix) preserve `typeArguments` when updating `TypeNode`

# 1.6.5 (06 Nov 2024)

- (Fix) handle dynamic import with static path

# 1.6.4 (31 Mar 2024)

- (Fix) join `data` from `createReadStream` with array rather than assign to string

# 1.6.3 (31 Jan 2024)

- (Fix) Handle `.jsx` and `.mjs` also

# 1.6.2 (31 Jan 2024)

- (Fix) Remove faulty `postinstall` command

# 1.6.1 (31 Jan 2024)

- (Fix) Read the proper code structure to know which part of import/export to update

# 1.6.0 (13 Oct 2023)

- (Feat) Append `.js` extension to directory with type declaration/definitions only
- (Refactor) Removed functionality to append `.js` to `mjs` files, since typescript compiler force us to append `.mjs` extensions

# 1.5.7 (27 Jul 2023)

- (Fix) Append `.js` extension to `mjs` files

# 1.5.7 (26 Jul 2023)

- (Fix) Remove accidentally-committed temp files

# 1.5.6 (15 Jul 2023)

- (Fix) Move `typescript` from `devDependencies` to `dependencies`

# 1.5.5 (5 Jul 2023)

- (Fix) Parse array of value with space

# 1.5.4 (23 June 2023)

- (Fix) Properly parse token of ` ` and replace with `=`, so `--dir build` becomes `--dir=build` internally

# 1.5.3 (22 June 2023)

- (Fix) Accept token of ` ` as same level as `=`, so `--dir=build` and `--dir build` is the same

# 1.5.2 (22 June 2023)

- (Fix) To be able to use on Windows

# 1.5.1 (4 June 2023)

- (Fix) Add relative paths to `package.json` exports

# 1.5.0 (21 May 2023)

- (Feat) Remove `@typescript-eslint/typescript-estree`, just use `tsc` to produce AST and manipulate import/export

# 1.4.0 (20 May 2023)

- (Feat) Remove 'readline' and use raw output for log `Num. (File Updated) - (SUCCEED or FAILED)`

# 1.3.4 (15 May 2023)

- (Fix) Remove `dts` folder and create `dts` folders for `cjs` and `mjs` folder

# 1.3.3 (6 Mar 2023)

- (Fix) Auto detect whether a file imported/exported is with `.js` or `.mjs` extension, so there is no need to specify what extension to be added

# 1.3.2 (27 Oct 2022)

- (Chore) Remove useless log

# 1.3.1 (27 Oct 2022)

- (Fix) Create `Progress` instance when there is at least one file to change

# 1.3.0 (27 Oct 2022)

- (Feat) Remove `console-table-printer` and replace it with manual progress log

# 1.2.6 (27 Oct 2022)

- (Fix) Optionally target `mjs` or `js` file, defaults to `js` file if parameters are not pass into

# 1.2.5 (25 Oct 2022)

- (Chore) Remove unnecessary log

# 1.2.4 (18 Oct 2022)

- (Feat) Provide API function `parseConfig` & `tsAddJsExtension`
- (Fix) Relative import `.` can be detected

# 1.2.3 (10 Sept 2022)

- (Fix) README JS code block render
- (Fix) Remove `/` from file path that ends with `/` as it cannot be detected as a folder
- (Chore) Improve README
- (Chore) Remove `parse-dont-validate` as parsing can be done manually

# 1.2.2 (6 Sept 2022)

- (Fix) README JS code block render
- (Chore) Simplify some code

# 1.2.1 (31 July 2022)

- (Chore) Remove `tsbuild-config` from build

# 1.2.0 (6 May 2022)

- (Feat) Auto add `/index.js` for import/export statement as we can omit `index` at the end of import/export
- (Feat) Show import/export that has changed, can optionally turn it off as it's on by default

# 1.1.0 (6 May 2022)

- (Fix) Read all javascript files to make sure relative imported file is JavaScript file before adding `.js` extension
- (Feat) Allow import from different root folder, for example, it is possible to add `.js` extension for imported JavaScript files from `common` into `src` folder

# 1.0.2 (20 Feb 2022)

- (Fix) Merge PR `https://github.com/P-YNPM/ts-add-js-extension/pull/2` to add `ExportAllDeclaration` to handle additional export JavaScript

# 1.0.1 (11 Feb 2022)

- (Feat) Made write file asynchronous to speed up writing

# 1.0.0 (13 Jan 2022)

- (Fix!) Removed minification, perform only single function -> Add .js extension to each relative import/export statement

# 0.0.5 (4 Dec 2021)

- (Chore) Change file in bin folder to JavaScript file and changed to import, not require

# 0.0.4 (4 Dec 2021)

- (Chore) Updated parse-dont-validate package version in package.json

# 0.0.3 (4 Dec 2021)

- (Feat) Added main entry point

# 0.0.2 (4 Dec 2021)

- (Feat) Added minification and remove comment option based on AST

# 0.0.1 (29 Nov 2021)

- (Chore) Added Git URL

# 0.0.0 (29 Nov 2021)

- (Feat) Initial public release
