declare module 'plugify' {
  export class Plugin {
    constructor(
      id: unknown,
      name: string,
      description: string,
      version: string,
      author: string,
      website: string,
      license: string,
      location: string,
      dependencies: unknown,
      base_dir: string,
      extensions_dir: string,
      configs_dir: string,
      data_dir: string,
      logs_dir: string,
      cache_dir: string
    );
    id: unknown;
    name: string;
    description: string;
    version: string;
    author: string;
    website: string;
    license: string;
    location: string;
    dependencies: unknown;
    base_dir: string;
    extensions_dir: string;
    configs_dir: string;
    data_dir: string;
    logs_dir: string;
    cache_dir: string;
  }

  export class Vector2 {
    constructor(x?: number, y?: number);
    x: number;
    y: number;
    add(vector: Vector2): Vector2;
    subtract(vector: Vector2): Vector2;
    scale(scalar: number): Vector2;
    magnitude(): number;
    normalize(): Vector2;
    dot(vector: Vector2): number;
    distanceTo(vector: Vector2): number;
    toString(): string;
    static zero(): Vector2;
    static unit(): Vector2;
  }

  export class Vector3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
    add(vector: Vector3): Vector3;
    subtract(vector: Vector3): Vector3;
    scale(scalar: number): Vector3;
    magnitude(): number;
    normalize(): Vector3;
    dot(vector: Vector3): number;
    cross(vector: Vector3): Vector3;
    distanceTo(vector: Vector3): number;
    toString(): string;
    static zero(): Vector3;
    static unit(): Vector3;
  }

  export class Vector4 {
    constructor(x?: number, y?: number, z?: number, w?: number);
    x: number;
    y: number;
    z: number;
    w: number;
    add(vector: Vector4): Vector4;
    subtract(vector: Vector4): Vector4;
    scale(scalar: number): Vector4;
    magnitude(): number;
    normalize(): Vector4;
    dot(vector: Vector4): number;
    distanceTo(vector: Vector4): number;
    toString(): string;
    static zero(): Vector4;
    static unit(): Vector4;
  }

  export type MatrixRows = [
    [number, number, number, number],
    [number, number, number, number],
    [number, number, number, number],
    [number, number, number, number]
  ];
  export class Matrix4x4 {
    constructor(m?: number[] | number[][] | null);
    m: number[][];
    add(matrix: Matrix4x4): Matrix4x4;
    subtract(matrix: Matrix4x4): Matrix4x4;
    multiply(matrix: Matrix4x4): Matrix4x4;
    multiplyVector(vector: Vector4): Vector4;
    transpose(): Matrix4x4;
    toString(): string;
    static identity(): Matrix4x4;
    static zero(): Matrix4x4;
    static scaling(sx: number, sy: number, sz: number): Matrix4x4;
    static translation(tx: number, ty: number, tz: number): Matrix4x4;
    static rotationX(angle: number): Matrix4x4;
    static rotationY(angle: number): Matrix4x4;
    static rotationZ(angle: number): Matrix4x4;
  }

  /** Runtime ownership markers created by makeEnum; not booleans themselves. */
  export interface OwnershipValue {
    readonly value: boolean;
    valueOf(): boolean;
  }
  export const Ownership: {
    readonly OWNED: OwnershipValue;
    readonly BORROWED: OwnershipValue;
    is(value: unknown): boolean;
  };

  export type BoundClassConstructor = (...args: unknown[]) => unknown;
  export type BoundMethod = readonly [
    methodName: string,
    func: (...args: any[]) => any,
    bindSelf: boolean,
    paramAliases: readonly (readonly [string, boolean] | null)[],
    retAlias: readonly [string, boolean] | null
  ];
  /** Wrap native handle constructors and methods; returns an enhanced runtime class. */
  export function bindClassMethods<T extends abstract new (...args: any[]) => any>(
    cls: T,
    constructors: readonly BoundClassConstructor[],
    destructor: ((handle: any) => void) | null,
    methods: readonly BoundMethod[],
    invalidValue?: number | bigint
  ): T;
}
