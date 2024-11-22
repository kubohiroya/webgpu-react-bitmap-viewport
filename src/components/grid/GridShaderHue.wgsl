struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) @interpolate(flat) isFocused: u32,
  @location(1) @interpolate(flat) isSelected: u32,
  @location(2) @interpolate(flat) cellValue: f32,
};

@group(0) @binding(5) var<storage, read> gridData: array<f32>;

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
    output.isSelected = select(FALSE, TRUE, checkSelected(gridX, gridY));
    output.cellValue = gridData[gridIndex];
    return output;
}

@fragment
fn fragmentBody(input: VertexOutput) -> @location(0) vec4f {
  let isInfinity = select(FALSE, TRUE, checkInfinity(input.cellValue));
  if(isInfinity == TRUE) {
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
