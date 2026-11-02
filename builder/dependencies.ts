import { parse } from '@babel/parser';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { PluginConfig } from './config';

const extensions = ['', '.ts', '.tsx', '.mts', '.js', '.mjs', '/index.ts', '/index.tsx', '/index.mts', '/index.js'];

function resolveLocal(fromFile: string, specifier: string): string | undefined {
  const base = resolve(dirname(fromFile), specifier);
  for (const extension of extensions) {
    const candidate = base + extension;
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return undefined;
}

export function discoverDependencies(pluginDir: string, config: PluginConfig): { name: string; constraints: string }[] {
  const found = new Set<string>();
  const visited = new Set<string>();
  function scan(file: string): void {
    file = resolve(file);
    if (visited.has(file)) return;
    visited.add(file);
    const source = readFileSync(file, 'utf8');
    const ast = parse(source, { sourceType: 'module', plugins: ['typescript'] });
    for (const node of ast.program.body) {
      if (node.type !== 'ImportDeclaration' && node.type !== 'ExportNamedDeclaration' && node.type !== 'ExportAllDeclaration') continue;
      if (node.type === 'ImportDeclaration' && node.importKind === 'type') continue;
      if (node.type === 'ExportNamedDeclaration' && node.exportKind === 'type') continue;
      const specifier = node.source?.value;
      if (typeof specifier !== 'string') continue;
      if (specifier.startsWith(':')) {
        found.add(specifier.slice(1));
      } else if (specifier.startsWith('.')) {
        const next = resolveLocal(file, specifier);
        if (!next) throw new Error(`Cannot resolve local import '${specifier}' from ${file}`);
        scan(next);
      }
    }
  }
  scan(resolve(pluginDir, config.entry));
  const configured = config.dependencies ?? {};
  for (const name of Object.keys(configured)) found.add(name);
  return [...found].sort().map(name => {
    const constraints = configured[name];
    if (!constraints) throw new Error(`Dependency '${name}' detected but no version set in plugin.config.ts`);
    return { name, constraints };
  });
}
