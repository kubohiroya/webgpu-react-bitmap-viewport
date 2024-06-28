struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) @interpolate(flat) isFocused: u32,
  @location(1) @interpolate(flat) isSelected: u32,
  @location(2) @interpolate(flat) rgba: vec4f,
};
@group(0) @binding(5) var<storage, read> gridData: array<u32>;

fn u32ToVec4f(value: u32) -> vec4<f32> {
    // Mask to isolate 8-bit segments
    let mask: u32 = 0xFF;

    // Extract each 8-bit segment
    let value0: f32 = f32((value >> 0) & mask);
    let value1: f32 = f32((value >> 8) & mask);
    let value2: f32 = f32((value >> 16) & mask);
    let value3: f32 = f32((value >> 24) & mask);

    return vec4f(value0, value1, value2, value3);
}

@vertex
fn vertexBody(
    input: VertexInput
) -> VertexOutput {
    let cellX: u32 = input.instanceIndex % u32uni.numColumnsToShow;
    let cellY: u32 = input.instanceIndex / u32uni.numColumnsToShow;
    let left = u32(viewports[u32uni.viewportIndex].x);
    let top = u32(viewports[u32uni.viewportIndex].y);
    let gridX: u32 = cellX + left;
    let gridY: u32 = cellY + top;
    let gridIndex = gridX + gridY * u32uni.gridSize.x;
    let columnFocused = checkColumnFocused(gridX);
    let rowFocused = checkRowFocused(gridY);

    var output: VertexOutput;
    output.position = vec4f(transform(cellX, cellY, input.position), 0, 1);
    output.isFocused = select(FALSE, TRUE, (!(columnFocused && rowFocused)) && (columnFocused || rowFocused));
    output.isSelected = select(FALSE, TRUE, checkSelected(gridX) || checkSelected(gridY));
    output.rgba = u32ToVec4f(gridData[gridIndex]) / 255.0;
    return output;
}

@vertex
fn vertexViewportShadow(input: RectVertexInput) -> VertexOutput {
  var output: VertexOutput;
  if(input.instanceIndex == u32uni.viewportIndex){
    return output;
  }
  let viewport: vec4f = viewports[input.instanceIndex];
  let left = viewport.x;
  let top = viewport.y;
  let right = viewport.z;
  let bottom = viewport.w;
  let scale = vec2f(right - left, bottom - top);
  let center = vec2f(left + right, top + bottom) / 2.0;
  output.position = vec4f(transform2(center, scale, rectVertices[input.vertexIndex % 6]), 0.0, 1.0);
  output.rgba = vec4f(0.3, 0.3, 0.3, 0.075);
  return output;
}

@fragment
fn fragmentBody(input: VertexOutput) -> @location(0) vec4f {
  return input.rgba;
}

@fragment
fn fragmentViewportShadow(input: VertexOutput) -> @location(0) vec4f {
  return input.rgba;
}