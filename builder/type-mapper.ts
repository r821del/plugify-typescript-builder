import type { TSType } from '@babel/types';

export type AbiType = 'void' | 'bool' | 'int32' | 'int64' | 'uint32' | 'uint64' | 'float' | 'double' | 'string';
const supported = new Set<AbiType>(['void', 'bool', 'int32', 'int64', 'uint32', 'uint64', 'float', 'double', 'string']);

export function mapType(type: TSType | undefined, explicit: string | undefined, context: string): AbiType {
  if (explicit) {
    if (!type) throw new Error(`${context}: missing TypeScript type annotation`);
    if (type) {
      const expected: Record<string, string> = { bool: 'TSBooleanKeyword', string: 'TSStringKeyword', int64: 'TSBigIntKeyword', uint64: 'TSBigIntKeyword', void: 'TSVoidKeyword', int32: 'TSNumberKeyword', uint32: 'TSNumberKeyword', float: 'TSNumberKeyword', double: 'TSNumberKeyword' };
      if (expected[explicit] && type.type !== expected[explicit]) throw new Error(`${context}: ABI '${explicit}' incompatible with TypeScript '${type.type}'`);
    }
    if (!supported.has(explicit as AbiType)) throw new Error(`${context}: unsupported ABI type '${explicit}'`);
    return explicit as AbiType;
  }
  if (!type) throw new Error(`${context}: missing TypeScript type annotation`);
  switch (type.type) {
    case 'TSBooleanKeyword': return 'bool';
    case 'TSStringKeyword': return 'string';
    case 'TSBigIntKeyword': return 'int64';
    case 'TSVoidKeyword': return 'void';
    case 'TSNumberKeyword': throw new Error(`${context}: number is ambiguous; add @plugify.param <name> int32 or @plugify.return double`);
    default: throw new Error(`${context}: unsupported TypeScript type '${type.type}'`);
  }
}
