import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { PluginConfig } from './config';
import { validateConfig } from './validate';
import { discoverDependencies } from './dependencies';

export interface LocalPlugin {
  folder: string;
  config: PluginConfig;
  localDependencies: string[];
}

export async function pluginGraph(root: string): Promise<Map<string, LocalPlugin>> {
  const entries = (await readdir(join(root, 'plugins'), { withFileTypes: true }))
    .filter(e => e.isDirectory()).map(e => e.name);
  const byName = new Map<string, LocalPlugin>();
  for (const folder of entries) {
    const pluginDir = resolve(root, 'plugins', folder);
    const module = await import(`${pathToFileURL(join(pluginDir, 'plugin.config.ts')).href}?v=${Date.now()}`);
    const config = module.default as PluginConfig;
    validateConfig(config);
    if (byName.has(config.name)) throw new Error(`Duplicate plugin name: ${config.name}`);
    byName.set(config.name, { folder, config, localDependencies: [] });
  }
  for (const plugin of byName.values()) {
    const deps = discoverDependencies(resolve(root, 'plugins', plugin.folder), plugin.config);
    plugin.localDependencies = deps.filter(d => byName.has(d.name)).map(d => d.name);
  }
  return byName;
}

export function sortedPlugins(graph: Map<string, LocalPlugin>, selected?: string): LocalPlugin[] {
  const state = new Map<string, number>();
  const result: LocalPlugin[] = [];
  const path: string[] = [];
  function visit(name: string): void {
    const status = state.get(name);
    if (status === 2) return;
    if (status === 1) throw new Error(`Circular plugin dependency: ${[...path, name].join(' -> ')}`);
    const plugin = graph.get(name);
    if (!plugin) throw new Error(`Unknown local plugin: ${name}`);
    state.set(name, 1);
    path.push(name);
    for (const dep of plugin.localDependencies) visit(dep);
    path.pop();
    state.set(name, 2);
    result.push(plugin);
  }
  if (selected) {
    const item = graph.get(selected) ?? [...graph.values()].find(p => p.folder === selected);
    if (!item) throw new Error(`Unknown plugin '${selected}'`);
    visit(item.config.name);
  } else {
    for (const name of [...graph.keys()].sort()) visit(name);
  }
  return result;
}

export function dependents(graph: Map<string, LocalPlugin>, names: Set<string>): Set<string> {
  const affected = new Set(names);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [name, plugin] of graph) {
      if (!affected.has(name) && plugin.localDependencies.some(dep => affected.has(dep))) {
        affected.add(name);
        changed = true;
      }
    }
  }
  return affected;
}
