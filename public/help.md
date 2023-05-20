ts-add-js-extension.js

Automatically appending the `.js` or `.mjs` extension to each relative import and export statement in ES Module JavaScript

This feature is particularly beneficial for TypeScript projects that target ES Module.

It is worth noting that this package intelligently handles import/export statements and adds `/index.js` where necessary,
allowing you to omit the explicit inclusion of index in the statement.

Additionally, it can determine whether a file with the mjs or js extension is being imported or exported

Options:

1. --version Show version number
   [value: number]

2. --help Show help
   [value: boolean]

Operation

1. --dir Specifies the folder where JavaScript file extension needs to be added
   [value: string] [required: yes]

2. --include Specifies the folder of files that are imported or included in the dir folder, excluding the specified dir
   [value: array of string] [required: no] [default: []]

3. --showchanges Determines whether to show changes for modified files in table format. Deprecated in favor of `showprogress` and will direct passed value to it
   [value: boolean] [required: no] [default: N/A]

4. --showprogress Developers can use the `--showprogress` argument for large projects to display a progress feedback
   [value: boolean] [required: no] [default: true]
