import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // ref: https://vitest.dev/config/
        watch: false,
        include: ['test/index.ts'],
        env: {
            TS_ADD_JS_EXTENSION_NODE_ENV: 'test',
        },
    },
});
