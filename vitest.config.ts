import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // ref: https://vitest.dev/config/
        watch: false,
        include: ['test/index.ts'],
    },
});
