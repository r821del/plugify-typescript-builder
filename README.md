<div align="center">

# ⚡ Plugify TypeScript Builder

**Build Counter-Strike 2 server plugins with Bun, TypeScript and Plugify V8.**

**Сборщик серверных плагинов Counter-Strike 2 на Bun, TypeScript и Plugify V8.**

![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-runtime-000000?style=flat-square&logo=bun&logoColor=white)
![Plugify](https://img.shields.io/badge/Plugify-V8-FFB000?style=flat-square)
![CS2](https://img.shields.io/badge/Counter--Strike-2-DAA520?style=flat-square)

[🇷🇺 Русский](#-русский) · [🇬🇧 English](#-english)

</div>

**🇷🇺 Русский**

> **Plugify TypeScript Builder** — независимый инструмент для разработки плагинов Counter-Strike 2 с использованием [Plugify](https://github.com/untrustedmodders/plugify) и [V8 Module](https://github.com/untrustedmodders/plugify-module-v8).
>
> Проект не является официальной частью Plugify и не поддерживается командой Untrusted Modders.

**🇬🇧 English**

> **Plugify TypeScript Builder** is an independent development tool for building Counter-Strike 2 plugins using [Plugify](https://github.com/untrustedmodders/plugify) and the [V8 Module](https://github.com/untrustedmodders/plugify-module-v8).
>
> This is an unofficial community project and is not affiliated with or maintained by the Untrusted Modders team.

---

# 🇷🇺 Русский

## О проекте

**Plugify TypeScript Builder** — инструмент для разработки и сборки JavaScript-плагинов для **Counter-Strike 2** с использованием **Plugify V8** и **S2SDK**.

### ✨ Возможности

- **Bun + TypeScript** — быстрая сборка `.mjs` и проверка типов.
- **Автоматический `.pplugin`** — метаданные, зависимости и публичные методы.
- **Межплагинный API** — экспорт функций через `@plugify.export`.
- **Автоматические `.d.ts`** — автодополнение API других плагинов.
- **Разделение `main.ts` / `api.ts`** — поддержка именованных реэкспортов.
- **Проверка ABI** — валидация поддерживаемых типов и сигнатур.
- **Граф зависимостей** — локальные зависимости собираются в правильном порядке; циклы обнаруживаются.
- **Dev-режим** — отслеживание файлов, пересборка изменённых и зависимых плагинов.
- **Генератор плагинов** — создание нового проекта одной командой.

## 📁 Структура проекта

```text
.
├── builder/                 # Сборщик, CLI, dev watcher и генераторы
├── plugins/
│   └── test/
│       ├── plugin.config.ts
│       └── src/
│           ├── main.ts
│           └── api.ts
├── types/
│   ├── plugify.d.ts
│   ├── s2sdk.d.ts
│   └── generated/          # Автоматически созданные API-декларации
├── dist/                   # Результаты сборки
├── package.json
└── tsconfig.json
```

## 🚀 Начало работы

**Требования:** [Bun](https://bun.sh/), TypeScript и зависимости сборщика (`@babel/parser`, `@babel/types`), установленные через `bun install`. Для запуска плагинов на сервере необходимы Plugify V8 и соответствующие зависимости, например S2SDK.

Пример скриптов `package.json`:

```json
{
  "scripts": {
    "build": "bun run builder/cli.ts build && bun run typecheck",
    "build:plugin": "bun run builder/cli.ts build",
    "dev": "bun run builder/dev.ts",
    "create": "bun run builder/cli.ts create",
    "typecheck": "tsc --noEmit",
    "clean": "bun run builder/cli.ts clean"
  }
}
```

```bash
bun install
bun run create vip
bun run build
```

## 🛠 Команды

| Команда | Назначение |
|---|---|
| `bun run build` | Собрать все плагины и проверить TypeScript |
| `bun run build:plugin test` | Собрать `test` и его локальные зависимости |
| `bun run dev` | Следить за изменениями и пересобирать затронутые плагины |
| `bun run create vip` | Создать шаблон плагина `vip` |
| `bun run typecheck` | Проверить TypeScript без сборки |
| `bun run clean` | Удалить `dist/` |

## 🧩 Пример плагина

**`plugins/vip/plugin.config.ts`**

```ts
import { definePlugin } from '../../builder/config';

export default definePlugin({
  name: 'vip',
  version: '0.1.0',
  description: 'VIP API for CS2',
  author: 'Your name',
  website: 'https://example.com',
  license: 'MIT',
  entry: 'src/main.ts',
  className: 'VipPlugin',
  dependencies: { s2sdk: '>=3.0.0' }
});
```

**`plugins/vip/src/main.ts`**

```ts
import { Plugin } from 'plugify';

export { hasVip } from './api';

export class VipPlugin extends Plugin {
  pluginStart(): void {
    console.log('[VIP] Started');
  }

  pluginEnd(): void {
    console.log('[VIP] Stopped');
  }
}
```

**`plugins/vip/src/api.ts`**

```ts
/**
 * @plugify.export HasVip
 * @plugify.param steamId int64
 * @plugify.return bool
 */
export function hasVip(steamId: bigint): boolean {
  return true;
}
```

Сборщик создаст:

```text
dist/vip/vip.mjs
dist/vip/vip.pplugin
types/generated/vip.d.ts
```

Декларация API будет выглядеть так:

```ts
declare module ':vip' {
  export function HasVip(steamId: bigint): boolean;
}
```

В другом плагине можно использовать публичный API:

```ts
import * as vip from ':vip';

const allowed: boolean = vip.HasVip(76561198000000000n);
```

Добавь `vip` с нужным ограничением версии в `dependencies` конфигурации потребителя. Имя `HasVip` — публичное имя из `@plugify.export`, а `hasVip` — имя JavaScript-функции.

## 🔍 Как работает сборка

```text
plugin.config.ts + src/main.ts + src/api.ts
                   │
                   ▼
        Анализ зависимостей и API
                   │
          ┌────────┴─────────┐
          ▼                  ▼
     Bun.build()        ABI / methods
          │                  │
          ▼             ┌────┴─────┐
      vip.mjs           ▼          ▼
                    vip.pplugin  vip.d.ts
```

Именованные реэкспорты поддерживаются, например `export { hasVip } from './api'`. Для публичного API используй обычные синхронные функции, экспортированные из модуля: методы экземпляра `Plugin` не являются экспортируемыми функциями Plugify V8.

---

# 🇬🇧 English

## Overview

**Plugify TypeScript Builder** is a development and build tool for **Counter-Strike 2** server plugins powered by **Plugify V8** and **S2SDK**.

### ✨ Features

- **Bun + TypeScript** — fast `.mjs` builds and static type checking.
- **Manifest generation** — automatically produces `.pplugin` metadata, dependencies, and methods.
- **Cross-plugin API** — expose module functions with `@plugify.export`.
- **Generated TypeScript declarations** — autocomplete for APIs imported by other plugins.
- **Clean code organization** — split lifecycle logic into `main.ts` and API functions into `api.ts`.
- **ABI validation** — checks supported parameter and return signatures.
- **Dependency graph** — builds local prerequisites first and detects dependency cycles.
- **Watch mode** — rebuilds changed plugins and their dependents.
- **Plugin scaffolding** — create a new plugin with a single command.

## 📁 Project layout

```text
.
├── builder/                 # CLI, bundler, watcher, generators
├── plugins/
│   └── test/
│       ├── plugin.config.ts
│       └── src/
│           ├── main.ts
│           └── api.ts
├── types/
│   ├── plugify.d.ts
│   ├── s2sdk.d.ts
│   └── generated/          # Generated API declarations
├── dist/                   # Build outputs
├── package.json
└── tsconfig.json
```

## 🚀 Getting started

**Requirements:** [Bun](https://bun.sh/), TypeScript, and builder dependencies (`@babel/parser`, `@babel/types`) installed with `bun install`. Your CS2 server also needs Plugify V8 and any required runtime dependencies, such as S2SDK.

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "build": "bun run builder/cli.ts build && bun run typecheck",
    "build:plugin": "bun run builder/cli.ts build",
    "dev": "bun run builder/dev.ts",
    "create": "bun run builder/cli.ts create",
    "typecheck": "tsc --noEmit",
    "clean": "bun run builder/cli.ts clean"
  }
}
```

```bash
bun install
bun run create vip
bun run build
```

## 🛠 Commands

| Command | Description |
|---|---|
| `bun run build` | Build every plugin, then type-check |
| `bun run build:plugin vip` | Build `vip` and its local prerequisites |
| `bun run dev` | Watch files and rebuild affected plugins |
| `bun run create vip` | Scaffold a new `vip` plugin |
| `bun run typecheck` | Run TypeScript checks only |
| `bun run clean` | Remove the `dist/` directory |

## 🧩 Writing a plugin

**`plugins/vip/plugin.config.ts`**

```ts
import { definePlugin } from '../../builder/config';

export default definePlugin({
  name: 'vip',
  version: '0.1.0',
  description: 'VIP API for CS2',
  author: 'Your name',
  website: 'https://example.com',
  license: 'MIT',
  entry: 'src/main.ts',
  className: 'VipPlugin',
  dependencies: { s2sdk: '>=3.0.0' }
});
```

**`plugins/vip/src/main.ts`**

```ts
import { Plugin } from 'plugify';

export { hasVip } from './api';

export class VipPlugin extends Plugin {
  pluginStart(): void {
    console.log('[VIP] Started');
  }

  pluginEnd(): void {
    console.log('[VIP] Stopped');
  }
}
```

**`plugins/vip/src/api.ts`**

```ts
/**
 * @plugify.export HasVip
 * @plugify.param steamId int64
 * @plugify.return bool
 */
export function hasVip(steamId: bigint): boolean {
  return true;
}
```

Build output:

```text
dist/vip/vip.mjs
dist/vip/vip.pplugin
types/generated/vip.d.ts
```

The generated API declaration:

```ts
declare module ':vip' {
  export function HasVip(steamId: bigint): boolean;
}
```

Call the API from another plugin:

```ts
import * as vip from ':vip';

const allowed: boolean = vip.HasVip(76561198000000000n);
```

Declare `vip` and its version constraint in the consumer plugin's `dependencies`. `HasVip` is the public API name; `hasVip` is the exported JavaScript function name.

## 🔍 Build pipeline

```text
plugin.config.ts + src/main.ts + src/api.ts
                   │
                   ▼
         Dependency / API scan
                   │
          ┌────────┴─────────┐
          ▼                  ▼
     Bun.build()         ABI / methods
          │                  │
          ▼             ┌────┴─────┐
      vip.mjs           ▼          ▼
                    vip.pplugin  vip.d.ts
```

Named re-exports such as `export { hasVip } from './api'` are supported. Plugify V8 expects **module-exported synchronous functions** for public APIs; instance methods of the `Plugin` class are not module exports.

---
