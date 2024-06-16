import { NUM_VERTICES_PER_POLYGON, U32LEN } from './Constants';
import {
  FIRST_VERTEX_OF_MARGINED_RECT_INDEX,
  FIRST_VERTEX_OF_RECT_AND_PIES_INDEX,
  FIRST_VERTEX_OF_RECT_INDEX,
  NUM_SCROLLBAR_END_ARCS
} from './Vertices';

export const DRAW_INDIRECT_BUFFER_SOURCE_INDEX: Record<string, number> = {
  BODY: 0,
  TOP_HEADER: 1,
  LEFT_HEADER: 2,
  SCROLLBAR_BACKGROUND: 3,
  SCROLLBAR_BODY: 4
};

const TO_BE_REPLACED = 0;
const DRAW_INDIRECT_ITEM_LEN = 4;

export const DRAW_INDIRECT_BUFFER_SOURCE = [
  // 0 body
  2 * NUM_VERTICES_PER_POLYGON, // vertexCount
  TO_BE_REPLACED, // instanceCount(numColumnsToShow * numRowsToShow)
  FIRST_VERTEX_OF_MARGINED_RECT_INDEX, // firstVertex
  0, // firstInstance

  // 1 topHeader
  2 * NUM_VERTICES_PER_POLYGON, // vertexCount
  TO_BE_REPLACED, // instanceCount(numColumnsToShow * 3)
  FIRST_VERTEX_OF_MARGINED_RECT_INDEX, // firstVertex
  0, // firstInstance

  // 2 leftHeader
  2 * NUM_VERTICES_PER_POLYGON, // vertexCount
  TO_BE_REPLACED, // instanceCount(numRowsToShow * 3)
  FIRST_VERTEX_OF_MARGINED_RECT_INDEX, // firstVertex
  0, // firstInstance

  // 3 scrollBarBackground
  2 * NUM_VERTICES_PER_POLYGON, // vertexCount
  2, // instanceCount(2 is stands for horizontal and vertical axis)
  FIRST_VERTEX_OF_RECT_INDEX, // firstVertex
  0, // firstInstance

  // 4 scrollBarBody
  (2 + NUM_SCROLLBAR_END_ARCS) * NUM_VERTICES_PER_POLYGON, // vertexCount
  2, // instanceCount(2 is stands for horizontal and vertical axis)
  FIRST_VERTEX_OF_RECT_AND_PIES_INDEX, // firstVertex
  0 // firstInstance
];

export const DRAW_INDIRECT_BUFFER_BYTE_INDEX = new Map<string, number>(
  Array.from(
    Object.entries(DRAW_INDIRECT_BUFFER_SOURCE_INDEX) as [string, number][],
    ([key, value]: [string, number]) => [
      key,
      value * DRAW_INDIRECT_ITEM_LEN * U32LEN
    ]
  )
);

const INSTANCE_COUNT_BYTE_INDEX = 1;

export const updateDrawIndirectBufferSource = (
  drawIndirectBufferSource: Uint32Array,
  numColumnsToShow: number,
  numRowsToShow: number
) => {
  drawIndirectBufferSource[
  DRAW_INDIRECT_BUFFER_SOURCE_INDEX.BODY * DRAW_INDIRECT_ITEM_LEN +
  INSTANCE_COUNT_BYTE_INDEX
    ] = numColumnsToShow * numRowsToShow;
  drawIndirectBufferSource[
  DRAW_INDIRECT_BUFFER_SOURCE_INDEX.TOP_HEADER * DRAW_INDIRECT_ITEM_LEN +
  INSTANCE_COUNT_BYTE_INDEX
    ] = numColumnsToShow;
  drawIndirectBufferSource[
  DRAW_INDIRECT_BUFFER_SOURCE_INDEX.LEFT_HEADER * DRAW_INDIRECT_ITEM_LEN +
  INSTANCE_COUNT_BYTE_INDEX
    ] = numRowsToShow;
};
