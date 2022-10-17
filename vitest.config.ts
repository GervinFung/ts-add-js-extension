import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // ref: https://vitest.dev/config/
        watch: false,
        globals: true,
        testTimeout: 43600,
        include: ['test/index.ts'],
        outputFile: './vitest-report.json',
        env: {
            TS_ADD_JS_EXTENSION_NODE_ENV: 'test',
        },
    },
});
