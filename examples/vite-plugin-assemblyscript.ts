import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import type { Plugin } from 'vite';

interface AssemblyScriptPluginOptions {
  projectRoot: string;
  configFile: string;
  sourceDirectory: string;
  entryFile: string;
}

export function assemblyScriptPlugin(
  options: AssemblyScriptPluginOptions,
): Plugin {
  const projectRoot = resolve(options.projectRoot);
  const configFile = resolve(projectRoot, options.configFile);
  const sourceDirectory = resolve(projectRoot, options.sourceDirectory);
  const entryFile = resolve(projectRoot, options.entryFile);
  const ascExecutable = resolve(
    projectRoot,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'asc.cmd' : 'asc',
  );

  for (const requiredPath of [configFile, sourceDirectory, entryFile]) {
    if (!existsSync(requiredPath)) {
      throw new Error(
        `[AssemblyScript] Required path does not exist: ${requiredPath}`,
      );
    }
  }

  const compile = (): void => {
    const result = spawnSync(
      ascExecutable,
      [entryFile, '--config', configFile, '--target', 'release'],
      {
        cwd: projectRoot,
        env: process.env,
        shell: process.platform === 'win32',
        stdio: 'inherit',
      },
    );

    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(
        `[AssemblyScript] Compilation failed with exit code ${result.status}`,
      );
    }
  };

  return {
    name: 'local-assemblyscript',
    buildStart: compile,
    handleHotUpdate({ file }) {
      if (
        file === sourceDirectory ||
        file.startsWith(`${sourceDirectory}${sep}`)
      ) {
        compile();
      }
    },
  };
}
