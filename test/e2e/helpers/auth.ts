import { Page } from '@playwright/test'

export async function loginViaOidc(page: Page, username: string, password: string) {
  await page.getByRole('link', { name: 'Syncloud' }).first().click()
  await page.locator('input#username-textfield').fill(username)
  await page.locator('input#password-textfield').fill(password)
  await page.locator('button#sign-in-button').click()
  await page.waitForURL((url) => url.host.startsWith('moodle.'), { timeout: 60_000 })
}
