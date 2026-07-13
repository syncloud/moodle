import { Page, expect } from '@playwright/test'
import { ssh } from './ssh'

export function adminPassword(): string {
  return ssh('cat /var/snap/moodle/current/.admin_password').trim()
}

export async function loginMoodle(page: Page, baseURL: string, username: string, password: string) {
  await page.goto('/login/index.php')
  await page.locator('#username').fill(username)
  await page.locator('#password').fill(password)
  await page.locator('#loginbtn').click()
  await page.waitForLoadState('networkidle')
  await page.goto('/my/')
  await expect(page).toHaveURL(/\/my\/?/)
}
