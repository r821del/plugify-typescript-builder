import { definePlugin } from '../../builder/config';

export default definePlugin({
    name: 'test',
    version: '1.0.0',

    description: 'Test plugin',
    author: 'r821del',
    website: 'https://github.com/r821del/auto-builder-plugify-plugins-v8',
    license: 'MIT',

    entry: 'src/main.ts',
    className: 'ExamplePlugin',

    dependencies: {
        s2sdk: '>=3.0.0'
    }
});