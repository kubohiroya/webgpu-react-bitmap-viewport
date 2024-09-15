override Inf: u32 = 999999;
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) @interpolate(flat) isFocused: u32,
  @location(1) @interpolate(flat) isSelected: u32,
  @location(2) @interpolate(flat) cellValue: u32,
};

@group(0) @binding(5) var<storage, read> gridData: array<u32>;

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
    output.cellValue = gridData[gridIndex];
    return output;
}

@fragment
fn fragmentBody(input: VertexOutput) -> @location(0) vec4f {
  let s = select(1, 0.5, isTrue(input.isFocused));
  let v = select(1, 0.5, isTrue(input.isSelected));
  if(input.cellValue == Inf){
      let rgb = hsvToRgb(1.0, 0.0, 1.0);
      return vec4f(rgb, 1.0);
  }
  let rgb = hsvToRgb(f32(input.cellValue) / 255, 0.9, 0.9);
  return vec4f(rgb, 1.0);
}
