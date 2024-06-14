// 6 vertices for a square
const squareVertices = [
  //   X,    Y,
  // bottom right triangle (anti-clockwise)
  // 0 left-bottom 1 right-bottom 2 right-top
  -1, -1, 1, -1, 1, 1,
  // top left triangle (anti-clockwise)
  // 3 left-bottom 4 right-top 5 left-top
  -1, -1, 1, 1, -1, 1,
];

const gridCellVertices = squareVertices.map((value) => value * 0.8);

export const SCROLLBAR_END_ARC_DIVISION = 24;
const pieVertices = new Array(SCROLLBAR_END_ARC_DIVISION * 3 * 2);
[...Array(SCROLLBAR_END_ARC_DIVISION).keys()].forEach((i) => {
  const pi0 = ((Math.PI * 2) / SCROLLBAR_END_ARC_DIVISION) * i;
  const pi1 = ((Math.PI * 2) / SCROLLBAR_END_ARC_DIVISION) * (i + 1);
  const radius = 0.95;
  let p = i * 3 * 2;
  pieVertices[p++] = 0;
  pieVertices[p++] = 0;
  pieVertices[p++] = Math.cos(pi1) * radius;
  pieVertices[p++] = Math.sin(pi1) * radius;
  pieVertices[p++] = Math.cos(pi0) * radius;
  pieVertices[p++] = Math.sin(pi0) * radius;
});

export const vertices = [...gridCellVertices, ...pieVertices];
