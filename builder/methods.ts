import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parse } from '@babel/parser';
import type { Comment, FunctionDeclaration, TSType } from '@babel/types';
import { mapType, type AbiType } from './type-mapper';

export interface PublicMethod {
  name: string;
  funcName: string;
  paramTypes: { name: string; type: AbiType }[];
  retType: { type: AbiType };
}

const extensions = ['', '.ts', '.tsx', '.mts', '.js', '.mjs', '/index.ts', '/index.tsx'];
function resolveModule(file: string, spec: string): string {
  if (!spec.startsWith('.')) throw new Error(`Only relative API re-exports supported: ${spec}`);
  const base = resolve(dirname(file), spec);
  for (const ext of extensions) {
    const path = base + ext;
    if (existsSync(path) && statSync(path).isFile()) return path;
  }
  throw new Error(`Cannot resolve API re-export '${spec}' from ${file}`);
}
function id(node: { type: string; name?: string; value?: unknown }): string {
  return node.type === 'Identifier' ? node.name! : String(node.value);
}
function docs(comments: readonly Comment[] | null | undefined): string {
  return comments?.map(c => c.value).join('\n') ?? '';
}

export function discoverMethods(entryFile: string, _className?: string): PublicMethod[] {
  const visited = new Set<string>();
  const methods: PublicMethod[] = [];
  const publicNames = new Set<string>();

  function methodFrom(fn: FunctionDeclaration, comment: string, publicExport: string, file: string): void {
    const match = comment.match(/@plugify\.export\s+([A-Za-z_$][\w$]*)/);
    if (!match) return;
    if (fn.async || fn.generator) throw new Error(`${file}: ${publicExport}: async/generator API not supported`);
    if (publicNames.has(match[1]!)) throw new Error(`Duplicate @plugify.export '${match[1]}'`);
    if (publicExport !== fn.id?.name && !/^[A-Za-z_$][\w$]*$/.test(publicExport)) {
      throw new Error(`${file}: invalid exported function name '${publicExport}'`);
    }
    const overrides = new Map<string, string>();
    for (const m of comment.matchAll(/@plugify\.param\s+(\w+)\s+(\w+)/g)) overrides.set(m[1]!, m[2]!);
    const returnOverride = comment.match(/@plugify\.return\s+(\w+)/)?.[1];
    const paramTypes = fn.params.map((param, i) => {
      if (param.type !== 'Identifier' || param.optional) throw new Error(`${file}: ${publicExport}: parameter ${i + 1} must be a required identifier`);
      const type = mapType(param.typeAnnotation?.typeAnnotation as TSType | undefined, overrides.get(param.name), `${publicExport}.${param.name}`);
      if (type === 'void') throw new Error(`${publicExport}.${param.name}: void parameter`);
      return { name: param.name, type };
    });
    if (paramTypes.length > 32) throw new Error(`${publicExport}: too many parameters`);
    for (const key of overrides.keys()) if (!paramTypes.some(p => p.name === key)) throw new Error(`${publicExport}: unknown @plugify.param ${key}`);
    const retType = { type: mapType(fn.returnType?.typeAnnotation as TSType | undefined, returnOverride, `${publicExport} return`) };
    publicNames.add(match[1]!);
    methods.push({ name: match[1]!, funcName: publicExport, paramTypes, retType });
  }

  function lookup(file: string, exportName: string, stack: Set<string>): { fn: FunctionDeclaration; doc: string; file: string } | undefined {
    const key = `${resolve(file)}#${exportName}`;
    if (stack.has(key)) throw new Error(`Circular API re-export: ${key}`);
    stack.add(key);
    const ast = parse(readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['typescript'] });
    const declarations = new Map<string, { fn: FunctionDeclaration; doc: string }>();
    for (const node of ast.program.body) {
      const fn = node.type === 'FunctionDeclaration' ? node : node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'FunctionDeclaration' ? node.declaration : null;
      if (fn?.id) declarations.set(fn.id.name, { fn, doc: docs(node.leadingComments) + '\n' + docs(fn.leadingComments) });
    }
    for (const node of ast.program.body) {
      if (node.type !== 'ExportNamedDeclaration' || node.exportKind === 'type') continue;
      if (node.declaration?.type === 'FunctionDeclaration' && node.declaration.id?.name === exportName) {
        const found = declarations.get(exportName);
        if (found) return { ...found, file };
      }
      for (const spec of node.specifiers) {
        if (spec.type !== 'ExportSpecifier' || id(spec.exported) !== exportName) continue;
        const original = id(spec.local);
        if (node.source) return lookup(resolveModule(file, node.source.value), original, stack);
        const found = declarations.get(original);
        if (found) return { ...found, file };
      }
    }
    return undefined;
  }

  function scan(file: string): void {
    file = resolve(file);
    if (visited.has(file)) return;
    visited.add(file);
    const ast = parse(readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['typescript'] });
    for (const node of ast.program.body) {
      if (node.type !== 'ExportNamedDeclaration' || node.exportKind === 'type') continue;
      if (node.declaration?.type === 'FunctionDeclaration' && node.declaration.id) {
        const fn = node.declaration;
        if (!fn.id) {
            throw new Error(`Anonymous exported function in ${file}`);
        }
        methodFrom(
            fn,
            docs(node.leadingComments) + '\n' + docs(fn.leadingComments),
            fn.id.name,
            file
        );
      }
      for (const spec of node.specifiers) {
        if (spec.type !== 'ExportSpecifier') continue;
        const publicName = id(spec.exported);
        const found = node.source
          ? lookup(resolveModule(file, node.source.value), id(spec.local), new Set())
          : lookup(file, id(spec.local), new Set());
        if (found) methodFrom(found.fn, found.doc, publicName, found.file);
      }
    }
  }
  scan(entryFile);
  return methods;
}
