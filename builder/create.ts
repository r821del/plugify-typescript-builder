import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

export async function createPlugin(root: string, name: string): Promise<void> {
  if (!/^[a-z][a-z0-9_]*$/.test(name)) throw new Error('Plugin name must match [a-z][a-z0-9_]*');
  const folder = join(root, 'plugins', name);
  try { await access(folder); throw new Error(`Plugin folder already exists: ${folder}`); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  const className = name.split('_').map(x => x[0]!.toUpperCase() + x.slice(1)).join('') + 'Plugin';
  await mkdir(join(folder, 'src'), { recursive: true });
  await writeFile(join(folder, 'plugin.config.ts'), `import { definePlugin } from '../../builder/config';\n\nexport default definePlugin({\n  name: '${name}',\n  version: '0.1.0',\n  description: '${name} plugin',\n  author: '-r8',\n  website: 'https://xcut.pw',\n  license: 'MIT',\n  entry: 'src/main.ts',\n  className: '${className}',\n  dependencies: {}\n});\n`);
  await writeFile(join(folder, 'src', 'main.ts'), `import { Plugin } from 'plugify';\n\nexport { ping } from './api';\n\nexport class ${className} extends Plugin {\n  pluginStart(): void {\n    console.log('[${name}] started');\n  }\n\n  pluginEnd(): void {\n    console.log('[${name}] stopped');\n  }\n}\n`);
  await writeFile(join(folder, 'src', 'api.ts'), `/**\n * @plugify.export Ping\n * @plugify.return bool\n */\nexport function ping(): boolean {\n  return true;\n}\n`);
  console.log(`✓ Created plugins/${name}/`);
}
