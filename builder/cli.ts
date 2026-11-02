import { resolve, join } from 'node:path';
import { rm } from 'node:fs/promises';
import { buildPlugin } from './build';
import { pluginGraph, sortedPlugins } from './graph';
import { createPlugin } from './create';

const root = resolve(import.meta.dir, '..');
const [command = 'build', selected, flag] = Bun.argv.slice(2);

if (command === 'clean') {
  await rm(join(root, 'dist'), { recursive: true, force: true });
  console.log('✓ dist cleaned');
} else if (command === 'create') {
  if (!selected) throw new Error('Usage: bun run create <name>');
  await createPlugin(root, selected);
} else if (command === 'build') {
  const graph = await pluginGraph(root);
  const ordered = flag === '--only' && selected
    ? [([...graph.values()].find(p => p.folder === selected || p.config.name === selected))]
    : sortedPlugins(graph, selected);
  for (const plugin of ordered) {
    if (!plugin) throw new Error(`Unknown plugin '${selected}'`);
    await buildPlugin(root, plugin.folder);
  }
} else {
  throw new Error(`Unknown command: ${command}`);
}
