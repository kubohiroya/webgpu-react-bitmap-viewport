const INSTANCE_COUNT_INDEX = 1;
const FIRST_VERTEX_INDEX = 2;

const XY_SET_LEN = 2;
const TRIANGLE = 3;

const a = -0.95;
const b = -0.7;
const c = 0.7;
const d = 0.95;
const octagonVertices = [
  a,
  c,
  c,
  d,
  b,
  d,
  a,
  c,
  d,
  c,
  c,
  d,
  a,
  b,
  d,
  c,
  a,
  c,
  a,
  b,
  d,
  b,
  d,
  c,
  b,
  a,
  c,
  a,
  d,
  b,
  b,
  a,
  d,
  b,
  a,
  b,
];

const rectVertices = [
  //   X,    Y,
  // bottom right triangle (anti-clockwise)
  // 0 left-bottom 1 right-bottom 2 right-top
  -1, -1, 1, -1, 1, 1,
  // top left triangle (anti-clockwise)
  // 3 left-bottom 4 right-top 5 left-top
  -1, -1, 1, 1, -1, 1,
];

// const marginedRectVertices = rectVertices.map((value) => value * 0.95);

const SCROLLBAR_END_ARC_SPLIT_COUNT = 24;
const setOfPiesVertices = new Array(
  SCROLLBAR_END_ARC_SPLIT_COUNT * TRIANGLE * XY_SET_LEN
);

[...Array(SCROLLBAR_END_ARC_SPLIT_COUNT).keys()].forEach((i) => {
  const pi0 = ((Math.PI * 2) / SCROLLBAR_END_ARC_SPLIT_COUNT) * i;
  const pi1 = ((Math.PI * 2) / SCROLLBAR_END_ARC_SPLIT_COUNT) * (i + 1);
  const radius = 0.95;
  let p = i * TRIANGLE * XY_SET_LEN;
  setOfPiesVertices[p++] = 0;
  setOfPiesVertices[p++] = 0;
  setOfPiesVertices[p++] = Math.cos(pi1) * radius;
  setOfPiesVertices[p++] = Math.sin(pi1) * radius;
  setOfPiesVertices[p++] = Math.cos(pi0) * radius;
  setOfPiesVertices[p++] = Math.sin(pi0) * radius;
});

export const VERTICES = [
  // 0 - 17
  //...marginedRectVertices,
  ...octagonVertices,
  // 18 - 23
  ...rectVertices,
  // 24 -
  ...setOfPiesVertices,
];

const FIRST_VERTEX_OF_MARGINED_RECT_INDEX = 0;
const FIRST_VERTEX_OF_RECT_INDEX = 18;

const ENTRY_INDEX: Record<string, number> = {
  BODY: 0,
  TOP_HEADER: 1,
  LEFT_HEADER: 2,
  SCROLLBAR_BACKGROUND: 3,
  SCROLLBAR_BODY: 4,
  VIEWPORT_SHADOW: 5,
  HEADER_BACKGROUND: 6,
};

export const ENTRY_SIZE = 4;

const PLACEHOLDER_FOR_INSTANCE_COUNT0 = 100; // dummy value
const PLACEHOLDER_FOR_INSTANCE_COUNT1 = 10; // dummy value
const PLACEHOLDER_FOR_INSTANCE_COUNT2 = 10; // dummy value

export const DRAW_INDIRECT_BUFFER_SOURCE = [
  // 0 body
  3 * 6, // 3 vertices * 6 triangles octagon (vertexCount)
  PLACEHOLDER_FOR_INSTANCE_COUNT0, // instanceCount(numColumnsToShow * numRowsToShow)
  0, // firstVertex
  0, // firstInstance

  // 1 topHeader
  3 * 2, // 3 vertices * 2 triangles square (vertexCount)
  PLACEHOLDER_FOR_INSTANCE_COUNT1, // instanceCount(numColumnsToShow * 3)
  0, // firstVertex
  0, // firstInstance

  // 2 leftHeader
  3 * 2, // 3 vertices * 2 triangles square (vertexCount)
  PLACEHOLDER_FOR_INSTANCE_COUNT2, // instanceCount(numRowsToShow * 3)
  0, // firstVertex
  0, // firstInstance

  // 3 scrollBarBackground
  3 * 2, // 3 vertices * 2 triangles square (vertexCount)
  2, // instanceCount(2 is stands for horizontal and vertical axis)
  18, //FIRST_VERTEX_OF_RECT_INDEX, // firstVertex
  0, // firstInstance

  // 4 scrollBarBody
  3 * (2 + SCROLLBAR_END_ARC_SPLIT_COUNT), // vertexCount
  2, // 2, // instanceCount(2 is stands for horizontal and vertical axis)
  18, // FIRST_VERTEX_OF_RECT_AND_PIES_INDEX, // firstVertex
  0, // firstInstance

  // 5 viewportShadow
  5 * 3 * 2, // 4 square * 3 vertices * 2 triangles (square with a hole) vertexCount
  4, // instanceCount // dummy
  0, // firstVertex
  0, // firstInstance

  3 * 2, // 1 square * 3 vertices * 2 triangles (square with a hole) vertexCount
  2, // instanceCount // top header & left header
  0, // firstVertex
  0, // firstInstance
];

export const DRAW_INDIRECT_BUFFER_BYTE_INDEX = new Map<string, number>(
  Array.from(
    Object.entries(ENTRY_INDEX) as [string, number][],
    ([key, value]: [string, number]) => [
      key,
      value * ENTRY_SIZE * Uint32Array.BYTES_PER_ELEMENT,
    ]
  )
);

export const updateDrawIndirectBufferSource = (
  drawIndirectBufferSource: Uint32Array,
  canvasSize: { width: number; height: number },
  headerMargin: { left: number; top: number },
  numColumnsToShow: number,
  numRowsToShow: number,
  numViewports: number
) => {
  const detailedMode: boolean =
    Math.min(
      (canvasSize.width - headerMargin.left) / numColumnsToShow,
      (canvasSize.height - headerMargin.top) / numRowsToShow
    ) < 10;

  drawIndirectBufferSource[ENTRY_INDEX.BODY * ENTRY_SIZE] = detailedMode
    ? 6
    : 18;

  drawIndirectBufferSource[ENTRY_INDEX.BODY * ENTRY_SIZE + FIRST_VERTEX_INDEX] =
    detailedMode
      ? FIRST_VERTEX_OF_RECT_INDEX
      : FIRST_VERTEX_OF_MARGINED_RECT_INDEX;

  drawIndirectBufferSource[
    ENTRY_INDEX.BODY * ENTRY_SIZE + INSTANCE_COUNT_INDEX
  ] = numColumnsToShow * numRowsToShow;

  drawIndirectBufferSource[
    ENTRY_INDEX.TOP_HEADER * ENTRY_SIZE + INSTANCE_COUNT_INDEX
  ] = numColumnsToShow;

  drawIndirectBufferSource[
    ENTRY_INDEX.LEFT_HEADER * ENTRY_SIZE + INSTANCE_COUNT_INDEX
  ] = numRowsToShow;

  drawIndirectBufferSource[
    ENTRY_INDEX.VIEWPORT_SHADOW * ENTRY_SIZE + INSTANCE_COUNT_INDEX
  ] = numViewports;
};
