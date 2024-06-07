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

struct F32Uniforms {
  gridSize: vec2f,
  canvasSize: vec2f,
  header: vec2f,
  viewportLeftTop: vec2f,
  viewportRightBottom: vec2f,
  viewportSize: vec2f,
  viewportOffset: vec2f,
};
@group(0) @binding(0) var<uniform> f32uniforms: F32Uniforms;

struct U32Uniforms {
  gridSize: vec2u,
  numColumnsToShow: u32,
  numRowsToShow: u32,
};
@group(0) @binding(1) var<uniform> u32uniforms: U32Uniforms;
@group(0) @binding(2) var<storage, read> focused: array<u32>;
@group(0) @binding(3) var<storage, read> selected: array<u32>;
@group(0) @binding(4) var<storage, read> gridData: array<f32>;

fn cellToWorld(cellX: u32, cellY: u32, position: vec2f) -> vec2f {
  let cell = vec2f(f32(cellX), f32(cellY));
  return (floor(f32uniforms.viewportLeftTop) + (cell + (position * vec2f(0.5, -0.5) + 0.5) )) ;
}

fn worldToViewport(world: vec2f) -> vec2f {
  return (world - f32uniforms.viewportLeftTop) / f32uniforms.viewportSize;
}

fn viewportToFrame(viewport: vec2f) -> vec2f {
  return (f32uniforms.header * viewport + f32uniforms.canvasSize * (1 - viewport)) / f32uniforms.canvasSize;
}

fn frameToCanvas(frame: vec2f) -> vec2f {
  return frame + ( f32uniforms.viewportOffset - f32uniforms.header) / f32uniforms.canvasSize;
}

fn canvasToDimension(canvas: vec2f) -> vec2f {
  return canvas * vec2f(-1, 1) + (1 - canvas) * vec2f(1, -1);
}

fn transform(cellX: u32, cellY: u32, position: vec2f) -> vec2f {
  let world = cellToWorld(cellX, cellY, position); // 0.0 - 1.0
  let viewport = worldToViewport(world);  // 0.0 - 1.0
  let frame = viewportToFrame(viewport); // 0.0 - 1.0
  let canvas = frameToCanvas(frame); // 0.0 - 1.0
  // let dimension = canvasToDimension(world / f32uniforms.gridSize); // test 1 passed
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
    let cellX: u32 = input.instanceIndex % u32uniforms.numColumnsToShow;
    let cellY: u32 = input.instanceIndex / u32uniforms.numColumnsToShow;
    let gridX: u32 = cellX + u32(f32uniforms.viewportLeftTop.x);
    let gridY: u32 = cellY + u32(f32uniforms.viewportLeftTop.y);
    output.position = vec4f(transform(cellX, cellY, input.position), 0.0, 1.0);
    output.vertexIndex = input.vertexIndex;
    let gridIndex = gridX + gridY * u32uniforms.gridSize.x;
    if(gridIndex % 5 != 0){
      output.cellValue = gridData[gridIndex];
    }else{
      output.cellValue = 0.999;
    }
    output.isInfinity = select(FALSE, TRUE, checkInfinity(output.cellValue));
    output.isFocused = select(FALSE, TRUE, checkColumnFocused(cellX) || checkRowFocused(cellY));
    output.isSelected = select(FALSE, TRUE, checkSelected(cellX) || checkSelected(cellY));
    return output;
}

@vertex
fn vertexLeftHeader(input: VertexInput) -> VertexOutput  {
  var output: VertexOutput;
  let cellY: u32 = input.instanceIndex;
  let gridY: u32 = cellY + u32(f32uniforms.viewportLeftTop.y);
  var transformed: vec2f = transform(0, cellY, input.position);
  output.position = vec4f(transformed, 0.0, 1.0);
  output.vertexIndex = input.vertexIndex;
  if(input.vertexIndex == 0u || input.vertexIndex == 3u || input.vertexIndex == 5u){
    output.position.x = -1.0;
  }else{
       output.position.x = -1 + 2 * f32uniforms.header.x / f32uniforms.canvasSize.x;
      if(input.instanceIndex == 0u && (input.vertexIndex == 2u || input.vertexIndex == 4u)){
        output.position.y = 1 - 2 * f32uniforms.header.y / f32uniforms.canvasSize.y;
      }
  }
  if(input.instanceIndex == 0u && input.vertexIndex == 5u){
    output.position.y = 1.0;
  }
  output.isFocused = select(FALSE, TRUE, checkColumnFocused(u32uniforms.numRowsToShow + input.instanceIndex));
  return output;
}

@vertex
fn vertexTopHeader(input: VertexInput) -> VertexOutput  {
  var output: VertexOutput;
  let cellX: u32 = input.instanceIndex;
  let gridX: u32 = cellX + u32(f32uniforms.viewportLeftTop.x);
  var transformed: vec2f = transform(cellX, 0, input.position);
  output.position = vec4f(transformed, 0.0, 1.0);
  output.vertexIndex = input.vertexIndex;
  if(input.vertexIndex == 2u || input.vertexIndex == 4u || input.vertexIndex == 5u){
    output.position.y = 1.0;
  }else{
    output.position.y = 1 - 2 * f32uniforms.header.y / f32uniforms.canvasSize.y;
    if(input.instanceIndex == 0u && (input.vertexIndex == 0u || input.vertexIndex == 3u)){
      output.position.x = -1 + 2 * f32uniforms.header.x / f32uniforms.canvasSize.x;
    }
  }
  if(input.instanceIndex == 0u && input.vertexIndex == 5u){
    output.position.x = -1.0;
  }
  output.isFocused = select(FALSE, TRUE, checkColumnFocused(u32uniforms.numColumnsToShow + input.instanceIndex));
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
  return vec4f(0.8, 0.6, 0.8, 1.0);

}
@fragment
fn fragmentTopHeader(input: VertexOutput) -> @location(0) vec4f {
  return vec4f(0.8, 0.6, 0.8, 1.0);
}
