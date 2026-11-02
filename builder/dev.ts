import { watch } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { pluginGraph, sortedPlugins, dependents } from './graph';

const root = resolve(import.meta.dir, '..');
const pluginsDir = join(root, 'plugins');
const builderDir = join(root, 'builder');
const typesDir = join(root, 'types');
const pending = new Set<string>();
let all = true;
let running = false;
let timer: ReturnType<typeof setTimeout> | undefined;

async function execute(args: string[]): Promise<boolean> {
  const child = Bun.spawn(args, { cwd: root, stdout: 'inherit', stderr: 'inherit' });
  return (await child.exited) === 0;
}
async function flush(): Promise<void> {
  if (running) return;
  running = true;
  try {
    while (all || pending.size) {
      const rebuildAll = all;
      const changedFolders = new Set(pending);
      all = false;
      pending.clear();
      const graph = await pluginGraph(root);
      const changedNames = new Set<string>();
      for (const [name, plugin] of graph) if (changedFolders.has(plugin.folder)) changedNames.add(name);
      const affected = rebuildAll ? new Set(graph.keys()) : dependents(graph, changedNames);
      let ok = true;
      for (const plugin of sortedPlugins(graph)) {
        if (!affected.has(plugin.config.name)) continue;
        console.log(`\n🔨 ${plugin.config.name}`);
        if (!(await execute(['bun', 'run', 'builder/cli.ts', 'build', plugin.folder, '--only']))) {
          ok = false;
          break;
        }
      }
      if (ok) {
        console.log('\n🔎 Checking TypeScript...');
        if (await execute(['bun', 'run', 'typecheck'])) console.log('✓ Typecheck passed');
        else console.error('✗ Typecheck failed');
      }
    }
  } catch (e) { console.error('[dev]', e); }
  finally {
    running = false;
    if (all || pending.size) void flush();
  }
}
function schedule(path?: string): void {
  if (!path) { all = true; }
  else {
    const absolute = resolve(path);
    const generated = join(typesDir, 'generated');
    if (absolute === generated || absolute.startsWith(generated + sep)) return;
    if (absolute.startsWith(builderDir + sep) || absolute.startsWith(typesDir + sep)) all = true;
    else {
      const rel = relative(pluginsDir, absolute);
      if (rel.startsWith('..') || rel.startsWith(sep)) return;
      const folder = rel.split(sep)[0];
      if (folder) pending.add(folder);
      else all = true;
    }
  }
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { timer = undefined; void flush(); }, 180);
}
for (const directory of [pluginsDir, builderDir, typesDir]) {
  try {
    watch(directory, { recursive: true }, (_event, file) => schedule(file ? join(directory, file.toString()) : undefined));
  } catch (error) { console.warn(`Cannot watch ${directory}:`, error); }
}
console.log('🚀 Plugify dev: watching plugins/, builder/, types/');
await flush();
