export async function loadImage(url: string): Promise<{data: Uint32Array, width: number, height: number}> {
  // Load the image
  const image = new Image();
  image.src = url;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  // Create a canvas and get the 2D context
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error("Could not get 2D context");
  }

  // Set canvas dimensions to image dimensions
  canvas.width = image.width;
  canvas.height = image.height;

  // Draw the image onto the canvas
  context.drawImage(image, 0, 0, image.width, image.height);

  // Get the image data
  const imageData = context.getImageData(0, 0, image.width, image.height);
  const data = imageData.data;

  // Convert the image data to Uint32Array
  const bitmapData = new Uint32Array(image.width * image.height);
  for (let i = 0; i < bitmapData.length; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const a = data[i * 4 + 3];

    // Combine RGBA into a single Uint32 value
    //bitmapData[i] = (r << 24) | (g << 16) | (b << 8) | a;
    bitmapData[i] = r << 0 | g << 8 | b << 16 | a << 24;
  }

  return {data: bitmapData, width: image.width, height: image.height};
}