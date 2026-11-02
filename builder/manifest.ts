import type { PluginConfig } from './config';
import type { PublicMethod } from './methods';

export const SCHEMA_URL = 'https://raw.githubusercontent.com/untrustedmodders/plugify/refs/heads/main/schemas/plugin.schema.json';

export function createManifest(config: PluginConfig, dependencies: { name: string; constraints: string }[], methods: PublicMethod[] = []) {
  return {
    $schema: SCHEMA_URL,
    version: config.version,
    name: config.name,
    description: config.description,
    author: config.author,
    website: config.website,
    license: config.license,
    entry: `bin.${config.name}.${config.className}`,
    platforms: config.platforms ?? [],
    language: 'javascript',
    dependencies,
    methods
  };
}
