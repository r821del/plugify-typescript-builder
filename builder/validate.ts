import type { PluginConfig } from './config';

const identifier = /^[A-Za-z_][A-Za-z0-9_]*$/;
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const constraint = /^\s*(?:[<>]=?|=)?\s*\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?(?:\s+(?:[<>]=?|=)?\s*\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)*\s*$/;

export function validateConfig(config: PluginConfig): void {
  if (!identifier.test(config.name)) throw new Error(`Invalid plugin name: ${config.name}`);
  if (!identifier.test(config.className)) throw new Error(`Invalid class name: ${config.className}`);
  if (!semver.test(config.version)) throw new Error(`Invalid version: ${config.version}`);
  for (const key of ['description', 'author', 'website', 'license'] as const) {
    if (!config[key]) throw new Error(`Missing ${key}`);
  }
  if (!/^https?:\/\//.test(config.website)) throw new Error('website must be an HTTP(S) URL');
  if (!/^src\/[\w./-]+\.tsx?$/.test(config.entry) || config.entry.includes('..')) {
    throw new Error('entry must point to a TypeScript file inside src/');
  }
  for (const [name, version] of Object.entries(config.dependencies ?? {})) {
    if (!identifier.test(name)) throw new Error(`Invalid dependency name: ${name}`);
    if (!constraint.test(version)) throw new Error(`Invalid Plugify constraint for ${name}: ${version}`);
  }
}
