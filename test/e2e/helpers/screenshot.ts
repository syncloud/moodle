import { Page } from '@playwright/test'
import * as path from 'node:path'
import * as fs from 'node:fs'

const artifactRoot = process.env.PLAYWRIGHT_ARTIFACT_DIR!

export function screenshotDir(): string {
  const dir = path.join(artifactRoot, 'screenshots')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export async function shoot(page: Page, name: string) {
  await page.screenshot({ path: path.join(screenshotDir(), `${name}.png`), fullPage: false })
}
