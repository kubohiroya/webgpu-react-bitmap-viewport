import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'src',
      bundler: 'vite',
      webServerCommands: {
        default: 'nx run gpu:serve',
        production: 'nx run gpu:preview',
      },
      ciWebServerCommand: 'nx run gpu:serve-static',
    }),
    baseUrl: 'http://localhost:4200',
  },
});
