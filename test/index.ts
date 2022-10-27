import testParseConfig from './config';
import testTsAddJsExtension from './process';
import testCases from 'cases-of-test';
import testProgress from './progress';

testCases({
    tests: [[testParseConfig], [testTsAddJsExtension], [testProgress]],
});
