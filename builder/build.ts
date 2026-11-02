import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { parse } from '@babel/parser';
import type { PluginConfig } from './config';
import { validateConfig } from './validate';
import { discoverDependencies } from './dependencies';
import { createManifest } from './manifest';
import { discoverMethods } from './methods';
import { generateDeclarations } from './declarations';


function isExportedClass(source: string, className: string): boolean {
    const ast = parse(source, {
        sourceType: 'module',
        plugins: ['typescript']
    });

    let declared = false;
    let exported = false;

    for (const node of ast.program.body) {
        if (node.type === 'ExportNamedDeclaration') {
            if (
                node.declaration?.type === 'ClassDeclaration' &&
                node.declaration.id?.name === className
            ) {
                declared = true;
                exported = true;
            }

            for (const spec of node.specifiers) {
                if (spec.type !== 'ExportSpecifier' || node.source) {
                    continue;
                }

                const localName = spec.local.type === 'Identifier'
                    ? spec.local.name
                    : spec.local.value;

                const exportedName = spec.exported.type === 'Identifier'
                    ? spec.exported.name
                    : spec.exported.value;

                if (
                    localName === className &&
                    exportedName === className
                ) {
                    exported = true;
                }
            }
        } else if (
            node.type === 'ClassDeclaration' &&
            node.id?.name === className
        ) {
            declared = true;
        }
    }

    return declared && exported;
}

export async function buildPlugin(root: string, folder: string): Promise<void> {
  const pluginDir = resolve(root, 'plugins', folder);
  const configPath = join(pluginDir, 'plugin.config.ts');
  const module = await import(`${pathToFileURL(configPath).href}?v=${Date.now()}`);
  const config = module.default as PluginConfig;
  validateConfig(config);
  const entryFile = resolve(pluginDir, config.entry);
  const source = await readFile(entryFile, 'utf8');
  if (!isExportedClass(source, config.className)) {
    throw new Error(`Exported class '${config.className}' not found in ${entryFile}`);
  }
  const dependencies = discoverDependencies(pluginDir, config);
  const methods = discoverMethods(entryFile, config.className);
  const outDir = resolve(root, 'dist', config.name);
  const output = await Bun.build({
    entrypoints: [entryFile],
    target: 'browser',
    format: 'esm',
    naming: `main.mjs`,
    external: ['plugify', ...dependencies.map(dep => `:${dep.name}`)]
  });
  if (!output.success) {
    for (const log of output.logs) console.error(log);
    throw new Error(`Bun build failed: ${config.name}`);
  }
  const main = output.outputs.find(file => file.path.endsWith('main.mjs')) ?? output.outputs[0];
  if (!main || output.outputs.length !== 1) {
    throw new Error(`Expected one JavaScript bundle, got ${output.outputs.length}`);
  }
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await Bun.write(join(outDir, `${config.name}.mjs`), main);
  const manifest = createManifest(config, dependencies, methods);
  await writeFile(
      join(outDir, `${config.name}.pplugin`),
      JSON.stringify(manifest, null, 2) + '\n'
  );
  await generateDeclarations(
      root,
      config.name,
      methods
  );
  console.log(`✓ ${config.name}: dist/${config.name}/`);
}
