// 6 vertices for a square

import { F32LEN, NUM_VERTICES_PER_POLYGON, XY_SET_LEN } from './Constants';

const rectVertices = [
  //   X,    Y,
  // bottom right triangle (anti-clockwise)
  // 0 left-bottom 1 right-bottom 2 right-top
  -1, -1, 1, -1, 1, 1,
  // top left triangle (anti-clockwise)
  // 3 left-bottom 4 right-top 5 left-top
  -1, -1, 1, 1, -1, 1
];

const marginedRectVertices = rectVertices.map((value) => value * 0.95);

export const NUM_SCROLLBAR_END_ARCS = 24;
const setOfPiesVertices = new Array(
  NUM_SCROLLBAR_END_ARCS * NUM_VERTICES_PER_POLYGON * XY_SET_LEN
);

[...Array(NUM_SCROLLBAR_END_ARCS).keys()].forEach((i) => {
  const pi0 = ((Math.PI * 2) / NUM_SCROLLBAR_END_ARCS) * i;
  const pi1 = ((Math.PI * 2) / NUM_SCROLLBAR_END_ARCS) * (i + 1);
  const radius = 0.95;
  let p = i * NUM_VERTICES_PER_POLYGON * XY_SET_LEN;
  setOfPiesVertices[p++] = 0;
  setOfPiesVertices[p++] = 0;
  setOfPiesVertices[p++] = Math.cos(pi1) * radius;
  setOfPiesVertices[p++] = Math.sin(pi1) * radius;
  setOfPiesVertices[p++] = Math.cos(pi0) * radius;
  setOfPiesVertices[p++] = Math.sin(pi0) * radius;
});

export const vertices = [
  // 0 - 5
  ...marginedRectVertices,
  // 6 - 11
  ...rectVertices,
  // 12 -
  ...setOfPiesVertices
];

export const VERTICES_BYTE_LENGTH = vertices.length * F32LEN;

export const FIRST_VERTEX_OF_MARGINED_RECT_INDEX = 0;
export const FIRST_VERTEX_OF_RECT_INDEX = 6;
export const FIRST_VERTEX_OF_RECT_AND_PIES_INDEX = 6;
