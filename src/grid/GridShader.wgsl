const TRUE = 1u;
const FALSE = 0u;

struct VertexInput {
  @builtin(instance_index) instanceIndex: u32,
  @builtin(vertex_index) vertexIndex: u32,
  @location(0) position: vec2f,
};

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) cellValue: f32,
  @location(1) @interpolate(flat) isInfinity: u32,
  @location(2) @interpolate(flat) isFocused: u32,
  @location(3) @interpolate(flat) isSelected: u32,
  @location(4) @interpolate(flat) vertexIndex: u32,
};

struct F32uni {
  gridSize: vec2f,
  canvasSize: vec2f,
  header: vec2f,
  viewportLeftTop: vec2f,
  viewportRightBottom: vec2f,
  viewportSize: vec2f,
  overscroll: vec2f,
};
@group(0) @binding(0) var<uniform> f32uni: F32uni;

struct U32uni {
  gridSize: vec2u,
  numColumnsToShow: u32,
  numRowsToShow: u32,
};
@group(0) @binding(1) var<uniform> u32uni: U32uni;
@group(0) @binding(2) var<storage, read> focused: array<u32>;
@group(0) @binding(3) var<storage, read> selected: array<u32>;
@group(0) @binding(4) var<storage, read> gridData: array<f32>;

fn cellToWorld(cellX: u32, cellY: u32, position: vec2f) -> vec2f {
  let cell = vec2f(f32(cellX), f32(cellY));
  return (floor(f32uni.viewportLeftTop) + (cell + (position * vec2f(0.5, -0.5) + 0.5) )) ;
}

fn worldToViewport(world: vec2f) -> vec2f {
  return (world - f32uni.viewportLeftTop) / f32uni.viewportSize;
}

fn viewportToFrame(viewport: vec2f) -> vec2f {
  return (f32uni.header * viewport + f32uni.canvasSize * (1 - viewport)) / f32uni.canvasSize;
}

fn frameToCanvas(frame: vec2f) -> vec2f {
  //return frame - ( f32uni.overscroll + f32uni.header) / f32uni.canvasSize;
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

@vertex
fn vertexBody(
    input: VertexInput
) -> VertexOutput {
    var output: VertexOutput;
    let cellX: u32 = input.instanceIndex % u32uni.numColumnsToShow;
    let cellY: u32 = input.instanceIndex / u32uni.numColumnsToShow;
    let gridX: u32 = cellX + u32(f32uni.viewportLeftTop.x);
    let gridY: u32 = cellY + u32(f32uni.viewportLeftTop.y);
    output.position = vec4f(transform(cellX, cellY, input.position), 0.0, 1.0);
    output.vertexIndex = input.vertexIndex;
    let gridIndex = gridX + gridY * u32uni.gridSize.x;
    output.cellValue = gridData[gridIndex];
    output.isInfinity = select(FALSE, TRUE, checkInfinity(output.cellValue));
    let columnFocused = checkColumnFocused(gridX);
    let rowFocused = checkRowFocused(gridY);
    output.isFocused = select(FALSE, TRUE, (!(columnFocused && rowFocused)) && (columnFocused || rowFocused));
    output.isSelected = select(FALSE, TRUE, checkSelected(gridX) || checkSelected(gridY));
    return output;
}

@vertex
fn vertexLeftHeader(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  let cellY: u32 = input.instanceIndex;
  let gridY: u32 = cellY + u32(f32uni.viewportLeftTop.y);
  let rowIndex: u32 = u32(f32uni.viewportLeftTop.y) + input.instanceIndex;
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
  let gridX: u32 = cellX + u32(f32uni.viewportLeftTop.x);
  let colIndex = u32(f32uni.viewportLeftTop.x) + input.instanceIndex;
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
  let gridX: u32 = cellX + u32(f32uni.viewportLeftTop.x);
  let colIndex = u32(f32uni.viewportLeftTop.x) + input.instanceIndex;
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
  let gridY: u32 = cellY + u32(f32uni.viewportLeftTop.y);
  let rowIndex: u32 = u32(f32uni.viewportLeftTop.y) + input.instanceIndex;
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

const scrollBarRadius: f32 = 3.0;
const scrollBarPadding: f32 = 2.0;

@vertex
fn vertexScrollBarBody(input: VertexInput) -> VertexOutput{

  var output: VertexOutput;
  output.position = vec4f(input.position, 0.0, 1.0);

  if(input.instanceIndex == 0){ // horizontal scrollbar
    let leftEdge: f32 = -1 +
     2 * ((f32uni.header.x - f32uni.overscroll.x + scrollBarRadius) / f32uni.canvasSize.x +
                            f32uni.viewportLeftTop.x *
                            (f32uni.canvasSize.x - f32uni.header.x - scrollBarRadius * 2) /
                             f32uni.canvasSize.x / f32uni.gridSize.x);
    let rightEdge: f32 = -1 +
     2 * ((f32uni.header.x - f32uni.overscroll.x + scrollBarRadius) / f32uni.canvasSize.x +
                            f32uni.viewportRightBottom.x *
                            (f32uni.canvasSize.x - f32uni.header.x - scrollBarRadius * 2) /
                             f32uni.canvasSize.x / f32uni.gridSize.x);
    if(input.vertexIndex < 6){
      let horizontalLineTop: f32 = -1 + 2 * (f32uni.overscroll.y + scrollBarPadding) / f32uni.canvasSize.y;
      let horizontalLineBottom: f32 = -1 + 2 * (f32uni.overscroll.y + scrollBarPadding + scrollBarRadius * 2) / f32uni.canvasSize.y;
      switch (input.vertexIndex){
          case 0, 3:{
            output.position = vec4f(leftEdge, horizontalLineBottom, 0, 1);
            return output;
          }
          case 1: {
            output.position = vec4f(rightEdge, horizontalLineBottom, 0, 1);
            return output;
          }
          case 2, 4: {
            output.position = vec4f(rightEdge, horizontalLineTop, 0, 1);
            return output;
          }
          case 5: {
            output.position = vec4f(leftEdge, horizontalLineTop, 0, 1);
            return output;
          }
          default:{
             return output;
          }
      }
    } else {
      let horizontalLineCenter: f32 = -1 + 2 * (f32uni.overscroll.y + scrollBarPadding + scrollBarRadius) / f32uni.canvasSize.y;
      let radius = 2 * scrollBarRadius / f32uni.canvasSize.y;
      if(( 6 <= input.vertexIndex && input.vertexIndex < 6 + 3 * 6) || (6 + 3 * 18 <= input.vertexIndex && input.vertexIndex < 6 + 3 * 24)){
          let center = vec2f(rightEdge, horizontalLineCenter);
          output.position = vec4f(input.position * radius + center, 0, 1);
      }else if(6 + 3 * 6 <= input.vertexIndex && input.vertexIndex < 6 + 3 * 18){
          let center = vec2f(leftEdge, horizontalLineCenter);
          output.position = vec4f(input.position * radius + center, 0, 1);
      }
      return output;
    }

  } else if(input.instanceIndex == 1){ // vertical scrollbar
    let topEdge: f32 = 1 - 2 * ((f32uni.header.y - f32uni.overscroll.y + scrollBarRadius) / f32uni.canvasSize.y +
                            f32uni.viewportLeftTop.y *
                            (f32uni.canvasSize.y - f32uni.header.y - scrollBarRadius * 2) /
                            f32uni.canvasSize.y / f32uni.gridSize.y);
    let bottomEdge: f32 = 1 - 2 * ((f32uni.header.y - f32uni.overscroll.y + scrollBarRadius) / f32uni.canvasSize.y +
                            f32uni.viewportRightBottom.y *
                            (f32uni.canvasSize.y - f32uni.header.y- scrollBarRadius * 2) / f32uni.canvasSize.y / f32uni.gridSize.y);

      if(input.vertexIndex < 6){
        let verticalLineLeft:f32 = 1 - 2 * (scrollBarPadding + f32uni.overscroll.x) / f32uni.canvasSize.x;
        let verticalLineRight:f32 = 1 - 2 * (scrollBarPadding + f32uni.overscroll.x + scrollBarRadius * 2) / f32uni.canvasSize.x;
        switch (input.vertexIndex){
          case 0, 3:{
            output.position = vec4f(verticalLineLeft, bottomEdge, 0, 1);
            return output;
          }
          case 1: {
            output.position = vec4f(verticalLineRight, bottomEdge, 0, 1);
            return output;
          }
          case 2, 4: {
            output.position = vec4f(verticalLineRight, topEdge, 0, 1);
            return output;
          }
          case 5: {
            output.position = vec4f(verticalLineLeft, topEdge, 0, 1);
            return output;
          }
          default:{
             return output;
          }
      }
    } else {
      let verticalLineCenter:f32 = 1 - 2 * (scrollBarPadding + f32uni.overscroll.x + scrollBarRadius) / f32uni.canvasSize.x;
      let radius = 2 * scrollBarRadius / f32uni.canvasSize.x;

      if(6 <= input.vertexIndex && input.vertexIndex < 6 + 3 * 12){
          let center = vec2f(verticalLineCenter, topEdge);
          output.position = vec4f(input.position * radius + center, 0, 1);
      }else if(6 + 3 * 12 <= input.vertexIndex && input.vertexIndex < 6 + 3 * 24){
          let center = vec2f(verticalLineCenter, bottomEdge);
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
fn fragmentBody(input: VertexOutput) -> @location(0) vec4f {
  if(isTrue(input.isInfinity)) {
    if(isTrue(input.isFocused)) {
      if(isTrue(input.isSelected)) {
        return vec4f(0.6, 0.6, 0.6, 0.9);
      } else {
        return vec4f(0.6, 0.6, 0.3, 0.9);
      }
    }else{
      if(isTrue(input.isSelected)) {
        return vec4f(0.6, 0.3, 0.6, 0.9);
      } else {
        return vec4f(0.6, 0.3, 0.3, 0.9);
      }
    }
  }else{
    if(isTrue(input.isFocused)) {
      if(isTrue(input.isSelected)) {
        let rgb = hsvToRgb(input.cellValue * 0.8, 0.5, 0.5);
        return vec4f(rgb, 0.9);
      } else {
        let rgb = hsvToRgb(input.cellValue * 0.8, 1.0, 0.5);
        return vec4f(rgb, 0.9);
      }
    } else {
      if(isTrue(input.isSelected)) {
        let rgb = hsvToRgb(input.cellValue * 0.8, 0.5, 1.0);
        return vec4f(rgb, 0.9);
      } else {
        let rgb = hsvToRgb(input.cellValue * 0.8, 1.0, 1.0);
        return vec4f(rgb, 0.9);
      }
    }
  }
}

@fragment
fn fragmentLeftHeader(input: VertexOutput) -> @location(0) vec4f {
  let focused = isTrue(input.isFocused);
  let selected = isTrue(input.isSelected);
  if(focused) {
    if(selected){
      return vec4f(0.9, 0.9, 0.0, 1.0);
    }else{
      return vec4f(0.7, 0.7, 0.7, 1.0);
    }
  }else{
    if(selected){
      return vec4f(0.8, 0.8, 0.6, 1.0);
    }else{
      return vec4f(0.5, 0.5, 0.5, 1.0);
    }
  }
}

@fragment
fn fragmentTopHeader(input: VertexOutput) -> @location(0) vec4f {
  let focused = isTrue(input.isFocused);
  let selected = isTrue(input.isSelected);
  if(focused) {
    if(selected){
      return vec4f(0.9, 0.9, 0.0, 1.0);
    }else{
      return vec4f(0.7, 0.7, 0.7, 1.0);
    }
  }else{
    if(selected){
      return vec4f(0.8, 0.8, 0.6, 1.0);
    }else{
      return vec4f(0.5, 0.5, 0.5, 1.0);
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
fn fragmentScrollBarBody(input: VertexOutput) -> @location(0) vec4f{
  return vec4f(0.4, 0.4, 0.4, 0.8);
}
