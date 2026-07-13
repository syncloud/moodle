import { defineConfig, devices } from '@playwright/test'

const fullDomain = process.env.PLAYWRIGHT_FULL_DOMAIN!
const appDomain = process.env.PLAYWRIGHT_APP_DOMAIN!
const artifactDir = process.env.PLAYWRIGHT_ARTIFACT_DIR!

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  maxFailures: 1,
  reporter: [['list']],
  globalTeardown: './globalTeardown.ts',
  timeout: 120_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: `https://${appDomain}`,
    ignoreHTTPSErrors: true,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 960 } },
    },
  ],
  metadata: {
    appDomain,
    fullDomain,
    artifactDir,
  },
})
