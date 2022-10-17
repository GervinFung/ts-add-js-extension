import testParseConfig from './config';
import testTsAddJsExtension from './process';

const tests: ReadonlyArray<Readonly<[() => void, 'only'?]>> = [
    [testParseConfig],
    [testTsAddJsExtension, 'only'],
];

const selectedTests = tests.filter(([_, only]) => only);

if (process.env.IS_CI && selectedTests.length) {
    throw new Error('cannot have "only" in ci cd');
}

(!selectedTests.length ? tests : selectedTests).forEach(([test]) => test());
