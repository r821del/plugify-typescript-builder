import { Plugin } from 'plugify';

export class ExamplePlugin extends Plugin {
    pluginStart(): void {
        console.log('Plugin started');
    }

    pluginEnd(): void {
        console.log('Plugin stopped');
    }
}