const TRUE = 1u;
const FALSE = 0u;
override scrollBarRadius: f32 = 5.0;
override scrollBarMargin: f32 = 2.0;

const rectVertices = array<vec2f, 6>(
  //   X,    Y,
  // bottom right triangle (anti-clockwise)
  // 0 left-bottom 1 right-bottom 2 right-top
   vec2f(-1, -1), vec2f(1, -1), vec2f(1, 1),
  // top left triangle (anti-clockwise)
  // 3 left-bottom 4 right-top 5 left-top
   vec2f(-1, -1),  vec2f(1, 1),  vec2f(-1, 1)
);

struct F32uni {
  gridSize: vec2f,
  canvasSize: vec2f,
  header: vec2f,
  overscroll: vec2f
};
@group(0) @binding(0) var<uniform> f32uni: F32uni;

struct U32uni {
  gridSize: vec2u,
  numColumnsToShow: u32,
  numRowsToShow: u32,
  scrollBarState: u32,
  viewportIndex: u32,
};
@group(0) @binding(1) var<uniform> u32uni: U32uni;
@group(0) @binding(2) var<storage, read> viewports: array<vec4f>;
@group(0) @binding(3) var<storage, read> focused: array<u32>;
@group(0) @binding(4) var<storage, read> selected: array<u32>;

struct VertexInput {
  @builtin(instance_index) instanceIndex: u32,
  @builtin(vertex_index) vertexIndex: u32,
  @location(0) position: vec2f,
};
struct RectVertexInput {
  @builtin(instance_index) instanceIndex: u32,
  @builtin(vertex_index) vertexIndex: u32,
};

fn shapeToWorld(center: vec2f, scale: vec2f, position: vec2f) -> vec2f {
  return center + (scale * position * vec2f(0.5, -0.5));
}

fn cellToWorld(cellX: u32, cellY: u32, position: vec2f) -> vec2f {
  let cell = vec2f(f32(cellX), f32(cellY));
  return floor(viewports[u32uni.viewportIndex].xy) + (cell + (position * vec2f(0.5, -0.5) + 0.5) );
}

fn worldToViewport(world: vec2f) -> vec2f {
  let viewportSize = viewports[u32uni.viewportIndex].zw - viewports[u32uni.viewportIndex].xy;
  return (world - viewports[u32uni.viewportIndex].xy) / viewportSize;
}

fn viewportToFrame(viewport: vec2f) -> vec2f {
  return (f32uni.header * viewport + f32uni.canvasSize * (1 - viewport)) / f32uni.canvasSize;
}

fn frameToCanvas(frame: vec2f) -> vec2f {
  // return frame - ( f32uni.overscroll + f32uni.header) / f32uni.canvasSize;
  return frame + ( f32uni.overscroll - f32uni.header) / f32uni.canvasSize;
}

fn canvasToDimension(canvas: vec2f) -> vec2f {
  return canvas * vec2f(-1, 1) + (1 - canvas) * vec2f(1, -1);
}

fn transform(cellX: u32, cellY: u32, position: vec2f) -> vec2f {
  let world = cellToWorld(cellX, cellY, position); // 0.0 - 1.0
  let viewport = worldToViewport(world);  // 0.0 - 1.0
  let frame = viewportToFrame(viewport); // 0.0 - 1.0
  let canvas = frameToCanvas(frame); // 0.0 - 1.0
  // let dimension = canvasToDimension(world / f32uni.gridSize); // test 1 passed
  // let dimension = canvasToDimension(viewport); // test 2 passed
  // let dimension = canvasToDimension(frame); // test 3 passed
  let dimension = canvasToDimension(canvas);
  return dimension;
}

fn transform2(center: vec2f, scale: vec2f, position: vec2f) -> vec2f {
  let world = shapeToWorld(center, scale, position); // 0.0 - 1.0
  let viewport = worldToViewport(world);  // 0.0 - 1.0
  let frame = viewportToFrame(viewport); // 0.0 - 1.0
  let canvas = frameToCanvas(frame); // 0.0 - 1.0
  let dimension = canvasToDimension(canvas);
  return dimension;
}

fn createPosition(instanceIndex: u32, position: vec2f) -> vec2f {
    let cellX: u32 = instanceIndex % u32uni.numColumnsToShow;
    let cellY: u32 = instanceIndex / u32uni.numColumnsToShow;
    let left = u32(viewports[u32uni.viewportIndex].x);
    let top = u32(viewports[u32uni.viewportIndex].y);
    let gridX: u32 = cellX + left;
    let gridY: u32 = cellY + top;
    let gridIndex = gridX + gridY * u32uni.gridSize.x;
    return transform(cellX, cellY, position);
}


@vertex
fn vertexLeftHeader(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  let cellY: u32 = input.instanceIndex;
  let top: u32 = u32(viewports[u32uni.viewportIndex].y);
  let gridY: u32 = cellY + top;
  let rowIndex: u32 = top + input.instanceIndex;
  var transformed: vec2f = transform(0, cellY, input.position);
  output.position = vec4f(transformed, 0.0, 1.0);
  // output.vertexIndex = input.vertexIndex;
  output.isFocused = select(FALSE, TRUE, checkRowFocused(rowIndex));
  output.isSelected = select(FALSE, TRUE, checkSelected(rowIndex));
  if(input.instanceIndex == 0){
    if(input.vertexIndex == 0u || input.vertexIndex == 3u || input.vertexIndex == 5u){
      output.position.x = -1.0;
    }else{
      output.position.x = -1 + 2 * f32uni.header.x / f32uni.canvasSize.x;
    }
    if(input.vertexIndex == 2u || input.vertexIndex == 4u || input.vertexIndex == 5u){
      output.position.y = 1.0;
    }
  }else{
    if(input.vertexIndex == 0u || input.vertexIndex == 3u || input.vertexIndex == 5u){
      output.position.x = -1.0;
    }else{
      output.position.x = -1 + 2 * f32uni.header.x / f32uni.canvasSize.x;
    }
  }
  return output;
}

@vertex
fn vertexTopHeader(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  let cellX: u32 = input.instanceIndex;
  let left: u32 = u32(viewports[u32uni.viewportIndex].x);
  let gridX: u32 = cellX + left;
  let colIndex = left + input.instanceIndex;
  var transformed: vec2f = transform(cellX, 0, input.position);
  output.position = vec4f(transformed, 0.0, 1.0);
  // output.vertexIndex = input.vertexIndex;
  output.isFocused = select(FALSE, TRUE, checkColumnFocused(colIndex));
  output.isSelected = select(FALSE, TRUE, checkSelected(colIndex));
  if(input.instanceIndex == 0){
    if(input.vertexIndex == 2u || input.vertexIndex == 3u || input.vertexIndex == 4u){
      output.position.y = 1.0;
      //output.position.y = 1 - 2 * f32uni.header.y / f32uni.canvasSize.y;
    }else{
      output.position.y = 1 - 2 * f32uni.header.y / f32uni.canvasSize.y;
    }
    if(input.vertexIndex == 0u || input.vertexIndex == 3u || input.vertexIndex == 5u){
      output.position.x = -1.0;
    }
  }else{
    if(input.vertexIndex == 2u || input.vertexIndex == 3u || input.vertexIndex == 4u){
      output.position.y = 1.0;
    }else{
      output.position.y = 1 + -2 * f32uni.header.y / f32uni.canvasSize.y;
    }
  }
  return output;
}

@vertex
fn vertexColumnFocusSelect(input: VertexInput) -> VertexOutput{
  var output: VertexOutput;
  let cellX: u32 = input.instanceIndex;
  let left: u32 = u32(viewports[u32uni.viewportIndex].x);
  let gridX: u32 = cellX + left;
  let colIndex = left + input.instanceIndex;
  var transformed: vec2f = transform(cellX, 0, input.position);
  output.position = vec4f(transformed, 0.0, 1.0);
  output.isFocused = select(FALSE, TRUE, checkColumnFocused(colIndex));
  output.isSelected = select(FALSE, TRUE, checkSelected(colIndex));

  if(input.vertexIndex == 2u || input.vertexIndex == 4u || input.vertexIndex == 5u){
    output.position.y = 1.0;
  }
  if(input.vertexIndex == 0u ||
    input.vertexIndex == 1u || input.vertexIndex == 3u){
    output.position.y = -1.0;
  }
  return output;
}

@vertex
fn vertexRowFocusSelect(input: VertexInput) -> VertexOutput{
  var output: VertexOutput;
  let cellY: u32 = input.instanceIndex;
  let top: u32 = u32(viewports[u32uni.viewportIndex].y);
  let gridY: u32 = cellY + top;
  let rowIndex: u32 = top + input.instanceIndex;
  var transformed: vec2f = transform(0, cellY, input.position);
  output.position = vec4f(transformed, 0.0, 1.0);
  output.isFocused = select(FALSE, TRUE, checkRowFocused(rowIndex));
  output.isSelected = select(FALSE, TRUE, checkSelected(rowIndex));
  if(input.vertexIndex == 1u || input.vertexIndex == 2u || input.vertexIndex == 4u){
      output.position.x = 1.0;
    }
    if(input.vertexIndex == 0u ||
    input.vertexIndex == 3u || input.vertexIndex == 5u){
    output.position.x = -1.0;
  }
  return output;
}

fn rectangleVertexPosition(vertexIndex: u32, left: f32, top: f32, right: f32, bottom: f32) -> vec4f {
  switch(vertexIndex % 6){
    case 0, 3: {
      return vec4f(left, bottom , 0, 1);
    }
    case 1: {
      return vec4f(right, bottom, 0, 1);
    }
    case 2, 4: {
      return vec4f(right, top, 0, 1);
    }
    case 5: {
      return vec4f(left, top, 0, 1);
    }
    default: {
      return vec4f(0, 0, 0, 1);
    }
  }
}

@vertex
fn vertexScrollBarBackground(input: VertexInput) -> VertexOutput{
  var output: VertexOutput;
  if(input.instanceIndex == 0){ // horizontal(bottom)
    let left = -1.0 + 2 * f32uni.header.x / f32uni.canvasSize.x;
    let right = 1.0;
    let top = -1.0 + 2 * (scrollBarRadius * 2 + scrollBarMargin) / f32uni.canvasSize.y;
    let bottom = -1.0 + 2 * scrollBarMargin / f32uni.canvasSize.y;
    output.position = rectangleVertexPosition(input.vertexIndex, left, top, right, bottom);
    output.isFocused = select(FALSE, TRUE, u32uni.scrollBarState == 1u || u32uni.scrollBarState == 3u);
  }else{ //vertical
    let left = 1.0 - 2 * (scrollBarRadius * 2 + scrollBarMargin) / f32uni.canvasSize.y;
    let top = 1.0 - 2 * f32uni.header.y / f32uni.canvasSize.y;
    let right = 1.0 - 2 * scrollBarMargin / f32uni.canvasSize.x;
    let bottom = -1.0;
    output.position = rectangleVertexPosition(input.vertexIndex, left, top, right, bottom);
    output.isFocused = select(FALSE, TRUE, u32uni.scrollBarState == 2u || u32uni.scrollBarState == 3u);
  }
  return output;
}

@vertex
fn vertexScrollBarBody(input: VertexInput) -> VertexOutput{
  var output: VertexOutput;
  if(u32uni.scrollBarState == 99u){
    return output;
  }
  output.position = vec4f(input.position, 0.0, 1.0);
  const baseIndex = 12;
  const NUM_VERTICES_PER_POLYGON = 3;
  if(input.instanceIndex == 0){ // horizontal scrollbar
    output.isFocused = select(FALSE, TRUE, u32uni.scrollBarState == 1u || u32uni.scrollBarState == 3u);
    let viewportLeft = viewports[u32uni.viewportIndex].x;
    let viewportRight = viewports[u32uni.viewportIndex].z;//means right
    let left: f32 = -1 +
      2 * ((f32uni.header.x - f32uni.overscroll.x + scrollBarRadius) / f32uni.canvasSize.x +
                            viewportLeft *
                            (f32uni.canvasSize.x - f32uni.header.x - scrollBarRadius * 2) /
                             f32uni.canvasSize.x / f32uni.gridSize.x);
    let right: f32 = -1 +
      2 * ((f32uni.header.x - f32uni.overscroll.x + scrollBarRadius) / f32uni.canvasSize.x +
                            viewportRight *
                            (f32uni.canvasSize.x - f32uni.header.x - scrollBarRadius * 2) /
                             f32uni.canvasSize.x / f32uni.gridSize.x);
    if(6 <= input.vertexIndex && input.vertexIndex < baseIndex){
      let top: f32 = -1 + 2 * (f32uni.overscroll.y + scrollBarMargin) / f32uni.canvasSize.y;
      let bottom: f32 = -1 + 2 * (f32uni.overscroll.y + scrollBarMargin + scrollBarRadius * 2) / f32uni.canvasSize.y;
      output.position = rectangleVertexPosition(input.vertexIndex - 6, left, top, right, bottom);
      return output;
    } else if(input.vertexIndex - baseIndex < 24 * 3){
      let horizontalLineCenter: f32 = -1 + 2 * (f32uni.overscroll.y + scrollBarMargin + scrollBarRadius) / f32uni.canvasSize.y;
      let radius = 2 * scrollBarRadius / f32uni.canvasSize.y;
      if(( input.vertexIndex < baseIndex + NUM_VERTICES_PER_POLYGON * 6) || (baseIndex + NUM_VERTICES_PER_POLYGON * 18 <= input.vertexIndex && input.vertexIndex < baseIndex + NUM_VERTICES_PER_POLYGON * 24)){
        let center = vec2f(right, horizontalLineCenter);
        output.position = vec4f(input.position * radius + center, 0, 1);
      }else if(baseIndex + NUM_VERTICES_PER_POLYGON * 6 <= input.vertexIndex && input.vertexIndex < baseIndex + NUM_VERTICES_PER_POLYGON * 18){
        let center = vec2f(left, horizontalLineCenter);
        output.position = vec4f(input.position * radius + center, 0, 1);
      }
      return output;
    }

  } else if(input.instanceIndex == 1){ // vertical scrollbar
    output.isFocused = select(FALSE, TRUE, u32uni.scrollBarState == 2u || u32uni.scrollBarState == 3u);
    let viewportTop = viewports[u32uni.viewportIndex].y;
    let viewportBottom = viewports[u32uni.viewportIndex].w;//means bottom
    let top: f32 = 1 - 2 * ((f32uni.header.y - f32uni.overscroll.y + scrollBarRadius) / f32uni.canvasSize.y +
                            viewportTop *
                            (f32uni.canvasSize.y - f32uni.header.y - scrollBarRadius * 2) /
                            f32uni.canvasSize.y / f32uni.gridSize.y);
    let bottom: f32 = 1 - 2 * ((f32uni.header.y - f32uni.overscroll.y + scrollBarRadius) / f32uni.canvasSize.y +
                            viewportBottom *
                            (f32uni.canvasSize.y - f32uni.header.y- scrollBarRadius * 2) / f32uni.canvasSize.y / f32uni.gridSize.y);

    if(input.vertexIndex < baseIndex){
      let left:f32 = 1 - 2 * (scrollBarMargin + f32uni.overscroll.x) / f32uni.canvasSize.x;
      let right:f32 = 1 - 2 * (scrollBarMargin + f32uni.overscroll.x + scrollBarRadius * 2) / f32uni.canvasSize.x;
      output.position = rectangleVertexPosition(input.vertexIndex - 6, left, top, right, bottom);
      return output;
    } else {
      let verticalLineCenter:f32 = 1 - 2 * (scrollBarMargin + f32uni.overscroll.x + scrollBarRadius) / f32uni.canvasSize.x;
      let radius = 2 * scrollBarRadius / f32uni.canvasSize.x;
      if(baseIndex <= input.vertexIndex && input.vertexIndex < baseIndex + NUM_VERTICES_PER_POLYGON * 12){
        let center = vec2f(verticalLineCenter, top);
        output.position = vec4f(input.position * radius + center, 0, 1);
      }else if(baseIndex + NUM_VERTICES_PER_POLYGON * 12 <= input.vertexIndex && input.vertexIndex < baseIndex + NUM_VERTICES_PER_POLYGON * 24){
        let center = vec2f(verticalLineCenter, bottom);
        output.position = vec4f(input.position * radius + center, 0, 1);
      }
      return output;
    }
  }
  return output;
}


// HSVからRGBへの変換を行う関数
fn hsvToRgb(h: f32, s: f32, v: f32) -> vec3f {
    if (s == 0.0) {
        // If saturation is 0, the color is grayscale
        return vec3f(v, v, v);
    } else {
        // Normalize hue to [0, 6)
        var h_i: f32 = h * 6.0;
        var i: u32 = u32(h_i) % 6;  // Index for selecting calculation method
        var f: f32 = h_i - f32(i);  // Fractional part

        var p: f32 = v * (1.0 - s);
        var q: f32 = v * (1.0 - (s * f));
        var t: f32 = v * (1.0 - (s * (1.0 - f)));

        // Calculate and return rgb based on i value
        switch (i) {
            case 0: { return vec3f(v, t, p);}
            case 1: { return vec3f(q, v, p);}
            case 2: { return vec3f(p, v, t);}
            case 3: { return vec3f(p, q, v);}
            case 4: { return vec3f(t, p, v);}
            case 5: { return vec3f(v, p, q); }
            default: { return vec3f(0.0, 0.0, 0.0);}  // Should never reach here
        }
    }
}

fn isTrue(value: u32) -> bool {
    return value == 1u;
}

fn isFalse(value: u32) -> bool {
    return value == 0u;
}

fn checkInfinity(value: f32) -> bool {
    return value == value + 1.0 || value == value - 1.0;
}

fn checkColumnFocused(columnIndex: u32) -> bool {
    return focused[columnIndex] == 1u || focused[columnIndex] == 3u;
}
fn checkRowFocused(rowIndex: u32) -> bool {
    return focused[rowIndex] == 2u || focused[rowIndex] == 3u;
}

fn checkSelected(index: u32) -> bool {
    return selected[index] == 1u;
}

@fragment
fn fragmentLeftHeader(input: VertexOutput) -> @location(0) vec4f {
  let focused = isTrue(input.isFocused);
  let selected = isTrue(input.isSelected);
  if(focused) {
    if(selected){
      return vec4f(0.9, 0.9, 0.0, 1);
    }else{
      return vec4f(0.7, 0.7, 0.7, 1);
    }
  }else{
    if(selected){
      return vec4f(0.8, 0.8, 0.6, 1);
    }else{
      return vec4f(0.5, 0.5, 0.5, 1);
    }
  }
}

@fragment
fn fragmentTopHeader(input: VertexOutput) -> @location(0) vec4f {
  let focused = isTrue(input.isFocused);
  let selected = isTrue(input.isSelected);
  if(focused) {
    if(selected){
      return vec4f(0.9, 0.9, 0.0, 1);
    }else{
      return vec4f(0.7, 0.7, 0.7, 1);
    }
  }else{
    if(selected){
      return vec4f(0.8, 0.8, 0.6, 1);
    }else{
      return vec4f(0.5, 0.5, 0.5, 1);
    }
  }
}

@fragment
fn fragmentColumnFocusSelect(input: VertexOutput) -> @location(0) vec4f{
  let focused = isTrue(input.isFocused);
  let selected = isTrue(input.isSelected);
  if(focused) {
    if(selected) {
      return vec4f(0.9, 0.9, 0.6, 0.5);
    }else{
      return vec4f(0.6, 0.6, 0.6, 0.5);
    }
  }else{
    if(selected) {
      return vec4f(0.9, 0.9, 0.7, 0.5);
    }else{
      return vec4f(1.0, 1.0, 1.0, 1.0);
    }
  }
}

@fragment
fn fragmentRowFocusSelect(input: VertexOutput) -> @location(0) vec4f{
  let focused = isTrue(input.isFocused);
  let selected = isTrue(input.isSelected);
  if(focused) {
    if(selected) {
      return vec4f(0.9, 0.9, 0.6, 0.5);
    }else{
      return vec4f(0.6, 0.6, 0.6, 0.5);
    }
  }else{
    if(selected) {
      return vec4f(0.9, 0.9, 0.7, 0.5);
    }else{
      return vec4f(1.0, 1.0, 1.0, 1.0);
    }
  }
}

@fragment
fn fragmentScrollBarBackground(input: VertexOutput) -> @location(0) vec4f{
  if(isTrue(input.isFocused)){
    return vec4f(0.5, 0.5, 0.5, 0.6);
  }else{
    return vec4f(0.8, 0.8, 0.8, 0.1);
  }
}

@fragment
fn fragmentScrollBarBody(input: VertexOutput) -> @location(0) vec4f{
  if(isTrue(input.isFocused)){
    return vec4f(0.1, 0.1, 0.1, 0.7);
  }else{
    return vec4f(0.3, 0.3, 0.3, 0.6);
  }
}
