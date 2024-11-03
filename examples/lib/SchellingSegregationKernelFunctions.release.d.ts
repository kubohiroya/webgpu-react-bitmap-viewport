/** Exported memory */
export declare const memory: WebAssembly.Memory;
// Exported runtime interface
export declare function __new(size: number, id: number): number;
export declare function __pin(ptr: number): number;
export declare function __unpin(ptr: number): void;
export declare function __collect(): void;
export declare const __rtti_base: number;
/**
 * src/as/assembly/SchellingSegregationKernelFunctions/createEmptyCellIndicesArray
 * @param data `~lib/typedarray/Uint32Array`
 * @param dataLength `i32`
 * @param emptyCellIndices `~lib/typedarray/Uint32Array`
 * @param EMPTY_VALUE `i32`
 * @returns `i32`
 */
export declare function createEmptyCellIndicesArray(data: Uint32Array, dataLength: number, emptyCellIndices: Uint32Array, EMPTY_VALUE: number): number;
/**
 * src/as/assembly/SchellingSegregationKernelFunctions/compactIndicesArray
 * @param movingAgentIndices `~lib/typedarray/Uint32Array`
 * @param agentIndicesLengthArray `~lib/typedarray/Uint32Array`
 * @param agentIndicesArray `~lib/typedarray/Uint32Array`
 * @param blockSize `i32`
 * @returns `src/as/assembly/SchellingSegregationKernelFunctions/CompactIndicesArrayResult`
 */
export declare function compactIndicesArray(movingAgentIndices: Uint32Array, agentIndicesLengthArray: Uint32Array, agentIndicesArray: Uint32Array, blockSize: number): __Record5<never>;
/**
 * src/as/assembly/SchellingSegregationKernelFunctions/shuffle
 * @param data `~lib/array/Array<i32>`
 * @returns `~lib/array/Array<i32>`
 */
export declare function shuffle(data: Array<number>): Array<number>;
/**
 * src/as/assembly/SchellingSegregationKernelFunctions/shuffleUint32Array
 * @param data `~lib/typedarray/Uint32Array`
 * @param length `i32`
 * @returns `~lib/typedarray/Uint32Array`
 */
export declare function shuffleUint32Array(data: Uint32Array, length: number): Uint32Array;
/**
 * src/as/assembly/SchellingSegregationKernelFunctions/moveAgentAndSwapEmptyCell
 * @param movingAgentIndices `~lib/typedarray/Uint32Array`
 * @param movingAgentIndicesLength `i32`
 * @param emptyCellIndices `~lib/typedarray/Uint32Array`
 * @param emptyCellIndicesLength `i32`
 * @param grid `~lib/typedarray/Uint32Array`
 * @param EMPTY_VALUE `i32`
 * @returns `src/as/assembly/SchellingSegregationKernelFunctions/MoveAgentAdnSwapEmptyCellResult`
 */
export declare function moveAgentAndSwapEmptyCell(movingAgentIndices: Uint32Array, movingAgentIndicesLength: number, emptyCellIndices: Uint32Array, emptyCellIndicesLength: number, grid: Uint32Array, EMPTY_VALUE: number): __Record7<never>;
/** src/as/assembly/SchellingSegregationKernelFunctions/CompactIndicesArrayResult */
declare interface __Record5<TOmittable> {
  /** @type `~lib/typedarray/Uint32Array` */
  movingAgentIndices: Uint32Array;
  /** @type `i32` */
  movingAgentIndicesLength: number | TOmittable;
}
/** src/as/assembly/SchellingSegregationKernelFunctions/MoveAgentAdnSwapEmptyCellResult */
declare interface __Record7<TOmittable> {
  /** @type `~lib/typedarray/Uint32Array` */
  grid: Uint32Array;
  /** @type `~lib/typedarray/Uint32Array` */
  emptyCellIndices: Uint32Array;
}
