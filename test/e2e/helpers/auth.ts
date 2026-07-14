import { Page } from '@playwright/test'

export async function loginViaOidc(page: Page, username: string, password: string) {
  await page.locator('input#username-textfield').fill(username)
  await page.locator('input#password-textfield').fill(password)
  await page.locator('button#sign-in-button').click()
  await page.waitForURL((url) => url.host.startsWith('moodle.'), { timeout: 60_000 })
}

export async function completeProfileIfNeeded(page: Page) {
  const firstname = page.locator('#id_firstname')
  if (!(await firstname.isVisible().catch(() => false))) {
    return
  }
  await firstname.fill('Syncloud')
  await page.locator('#id_lastname').fill('User')
  const email = page.locator('#id_email')
  if (!(await email.inputValue().catch(() => ''))) {
    await email.fill('user@bookworm.com')
  }
  await page.locator('#id_submitbutton').click()
  await page.waitForLoadState('networkidle')
}
