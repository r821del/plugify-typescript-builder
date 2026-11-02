export interface PluginConfig {
  name: string;
  version: string;
  description: string;
  author: string;
  website: string;
  license: string;
  entry: string;
  className: string;
  dependencies?: Record<string, string>;
  platforms?: string[];
}

export function definePlugin<const T extends PluginConfig>(config: T): T {
  return config;
}
