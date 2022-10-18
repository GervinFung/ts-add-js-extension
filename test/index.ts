import testParseConfig from './config';
import testTsAddJsExtension from './process';
import testCases from 'cases-of-test';

testCases({
    tests: [[testParseConfig], [testTsAddJsExtension]],
});
