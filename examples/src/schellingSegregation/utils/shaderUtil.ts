export const replaceConstValue = (
  shader: string,
  entries: { [key: string]: number },
) => {
  return shader
    .split(/\r?\n/)
    .map((line: string) => {
      Object.keys(entries).forEach((key) => {
        line = line.replace(
          new RegExp(`const ${key}: u32 = \\d+u;`),
          `const ${key}: u32 = ${entries[key]}u;`,
        );
      });
      return line;
    })
    .join('\n');
};
