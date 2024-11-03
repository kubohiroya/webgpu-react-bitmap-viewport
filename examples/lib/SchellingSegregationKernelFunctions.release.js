async function instantiate(module, imports = {}) {
  const adaptedImports = {
    env: Object.assign(Object.create(globalThis), imports.env || {}, {
      abort(message, fileName, lineNumber, columnNumber) {
        // ~lib/builtins/abort(~lib/string/String | null?, ~lib/string/String | null?, u32?, u32?) => void
        message = __liftString(message >>> 0);
        fileName = __liftString(fileName >>> 0);
        lineNumber = lineNumber >>> 0;
        columnNumber = columnNumber >>> 0;
        (() => {
          // @external.js
          throw Error(`${message} in ${fileName}:${lineNumber}:${columnNumber}`);
        })();
      },
      seed() {
        // ~lib/builtins/seed() => f64
        return (() => {
          // @external.js
          return Date.now() * Math.random();
        })();
      },
    }),
  };
  const { exports } = await WebAssembly.instantiate(module, adaptedImports);
  const memory = exports.memory || imports.env.memory;
  const adaptedExports = Object.setPrototypeOf({
    createEmptyCellIndicesArray(data, dataLength, emptyCellIndices, EMPTY_VALUE) {
      // src/as/assembly/SchellingSegregationKernelFunctions/createEmptyCellIndicesArray(~lib/typedarray/Uint32Array, i32, ~lib/typedarray/Uint32Array, i32) => i32
      data = __retain(__lowerTypedArray(Uint32Array, 4, 2, data) || __notnull());
      emptyCellIndices = __lowerTypedArray(Uint32Array, 4, 2, emptyCellIndices) || __notnull();
      try {
        return exports.createEmptyCellIndicesArray(data, dataLength, emptyCellIndices, EMPTY_VALUE);
      } finally {
        __release(data);
      }
    },
    compactIndicesArray(movingAgentIndices, agentIndicesLengthArray, agentIndicesArray, blockSize) {
      // src/as/assembly/SchellingSegregationKernelFunctions/compactIndicesArray(~lib/typedarray/Uint32Array, ~lib/typedarray/Uint32Array, ~lib/typedarray/Uint32Array, i32) => src/as/assembly/SchellingSegregationKernelFunctions/CompactIndicesArrayResult
      movingAgentIndices = __retain(__lowerTypedArray(Uint32Array, 4, 2, movingAgentIndices) || __notnull());
      agentIndicesLengthArray = __retain(__lowerTypedArray(Uint32Array, 4, 2, agentIndicesLengthArray) || __notnull());
      agentIndicesArray = __lowerTypedArray(Uint32Array, 4, 2, agentIndicesArray) || __notnull();
      try {
        return __liftRecord5(exports.compactIndicesArray(movingAgentIndices, agentIndicesLengthArray, agentIndicesArray, blockSize) >>> 0);
      } finally {
        __release(movingAgentIndices);
        __release(agentIndicesLengthArray);
      }
    },
    shuffle(data) {
      // src/as/assembly/SchellingSegregationKernelFunctions/shuffle(~lib/array/Array<i32>) => ~lib/array/Array<i32>
      data = __lowerArray(__setU32, 6, 2, data) || __notnull();
      return __liftArray(__getI32, 2, exports.shuffle(data) >>> 0);
    },
    shuffleUint32Array(data, length) {
      // src/as/assembly/SchellingSegregationKernelFunctions/shuffleUint32Array(~lib/typedarray/Uint32Array, i32) => ~lib/typedarray/Uint32Array
      data = __lowerTypedArray(Uint32Array, 4, 2, data) || __notnull();
      return __liftTypedArray(Uint32Array, exports.shuffleUint32Array(data, length) >>> 0);
    },
    moveAgentAndSwapEmptyCell(movingAgentIndices, movingAgentIndicesLength, emptyCellIndices, emptyCellIndicesLength, grid, EMPTY_VALUE) {
      // src/as/assembly/SchellingSegregationKernelFunctions/moveAgentAndSwapEmptyCell(~lib/typedarray/Uint32Array, i32, ~lib/typedarray/Uint32Array, i32, ~lib/typedarray/Uint32Array, i32) => src/as/assembly/SchellingSegregationKernelFunctions/MoveAgentAdnSwapEmptyCellResult
      movingAgentIndices = __retain(__lowerTypedArray(Uint32Array, 4, 2, movingAgentIndices) || __notnull());
      emptyCellIndices = __retain(__lowerTypedArray(Uint32Array, 4, 2, emptyCellIndices) || __notnull());
      grid = __lowerTypedArray(Uint32Array, 4, 2, grid) || __notnull();
      try {
        return __liftRecord7(exports.moveAgentAndSwapEmptyCell(movingAgentIndices, movingAgentIndicesLength, emptyCellIndices, emptyCellIndicesLength, grid, EMPTY_VALUE) >>> 0);
      } finally {
        __release(movingAgentIndices);
        __release(emptyCellIndices);
      }
    },
  }, exports);
  function __liftRecord5(pointer) {
    // src/as/assembly/SchellingSegregationKernelFunctions/CompactIndicesArrayResult
    // Hint: Opt-out from lifting as a record by providing an empty constructor
    if (!pointer) return null;
    return {
      movingAgentIndices: __liftTypedArray(Uint32Array, __getU32(pointer + 0)),
      movingAgentIndicesLength: __getI32(pointer + 4),
    };
  }
  function __liftRecord7(pointer) {
    // src/as/assembly/SchellingSegregationKernelFunctions/MoveAgentAdnSwapEmptyCellResult
    // Hint: Opt-out from lifting as a record by providing an empty constructor
    if (!pointer) return null;
    return {
      grid: __liftTypedArray(Uint32Array, __getU32(pointer + 0)),
      emptyCellIndices: __liftTypedArray(Uint32Array, __getU32(pointer + 4)),
    };
  }
  function __liftString(pointer) {
    if (!pointer) return null;
    const
      end = pointer + new Uint32Array(memory.buffer)[pointer - 4 >>> 2] >>> 1,
      memoryU16 = new Uint16Array(memory.buffer);
    let
      start = pointer >>> 1,
      string = "";
    while (end - start > 1024) string += String.fromCharCode(...memoryU16.subarray(start, start += 1024));
    return string + String.fromCharCode(...memoryU16.subarray(start, end));
  }
  function __liftArray(liftElement, align, pointer) {
    if (!pointer) return null;
    const
      dataStart = __getU32(pointer + 4),
      length = __dataview.getUint32(pointer + 12, true),
      values = new Array(length);
    for (let i = 0; i < length; ++i) values[i] = liftElement(dataStart + (i << align >>> 0));
    return values;
  }
  function __lowerArray(lowerElement, id, align, values) {
    if (values == null) return 0;
    const
      length = values.length,
      buffer = exports.__pin(exports.__new(length << align, 1)) >>> 0,
      header = exports.__pin(exports.__new(16, id)) >>> 0;
    __setU32(header + 0, buffer);
    __dataview.setUint32(header + 4, buffer, true);
    __dataview.setUint32(header + 8, length << align, true);
    __dataview.setUint32(header + 12, length, true);
    for (let i = 0; i < length; ++i) lowerElement(buffer + (i << align >>> 0), values[i]);
    exports.__unpin(buffer);
    exports.__unpin(header);
    return header;
  }
  function __liftTypedArray(constructor, pointer) {
    if (!pointer) return null;
    return new constructor(
      memory.buffer,
      __getU32(pointer + 4),
      __dataview.getUint32(pointer + 8, true) / constructor.BYTES_PER_ELEMENT
    ).slice();
  }
  function __lowerTypedArray(constructor, id, align, values) {
    if (values == null) return 0;
    const
      length = values.length,
      buffer = exports.__pin(exports.__new(length << align, 1)) >>> 0,
      header = exports.__new(12, id) >>> 0;
    __setU32(header + 0, buffer);
    __dataview.setUint32(header + 4, buffer, true);
    __dataview.setUint32(header + 8, length << align, true);
    new constructor(memory.buffer, buffer, length).set(values);
    exports.__unpin(buffer);
    return header;
  }
  const refcounts = new Map();
  function __retain(pointer) {
    if (pointer) {
      const refcount = refcounts.get(pointer);
      if (refcount) refcounts.set(pointer, refcount + 1);
      else refcounts.set(exports.__pin(pointer), 1);
    }
    return pointer;
  }
  function __release(pointer) {
    if (pointer) {
      const refcount = refcounts.get(pointer);
      if (refcount === 1) exports.__unpin(pointer), refcounts.delete(pointer);
      else if (refcount) refcounts.set(pointer, refcount - 1);
      else throw Error(`invalid refcount '${refcount}' for reference '${pointer}'`);
    }
  }
  function __notnull() {
    throw TypeError("value must not be null");
  }
  let __dataview = new DataView(memory.buffer);
  function __setU32(pointer, value) {
    try {
      __dataview.setUint32(pointer, value, true);
    } catch {
      __dataview = new DataView(memory.buffer);
      __dataview.setUint32(pointer, value, true);
    }
  }
  function __getI32(pointer) {
    try {
      return __dataview.getInt32(pointer, true);
    } catch {
      __dataview = new DataView(memory.buffer);
      return __dataview.getInt32(pointer, true);
    }
  }
  function __getU32(pointer) {
    try {
      return __dataview.getUint32(pointer, true);
    } catch {
      __dataview = new DataView(memory.buffer);
      return __dataview.getUint32(pointer, true);
    }
  }
  return adaptedExports;
}
export const {
  memory,
  __new,
  __pin,
  __unpin,
  __collect,
  __rtti_base,
  createEmptyCellIndicesArray,
  compactIndicesArray,
  shuffle,
  shuffleUint32Array,
  moveAgentAndSwapEmptyCell,
} = await (async url => instantiate(
  await (async () => {
    const isNodeOrBun = typeof process != "undefined" && process.versions != null && (process.versions.node != null || process.versions.bun != null);
    if (isNodeOrBun) { return globalThis.WebAssembly.compile(await (await import("node:fs/promises")).readFile(url)); }
    else { return await globalThis.WebAssembly.compileStreaming(globalThis.fetch(url)); }
  })(), {
  }
))(new URL("SchellingSegregationKernelFunctions.release.wasm", import.meta.url));
