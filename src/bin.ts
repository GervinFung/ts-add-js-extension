#!/usr/bin/env node
import main from './';
import { a } from './a.mjs';
console.log({ a });
main(process.argv.join(' '));
