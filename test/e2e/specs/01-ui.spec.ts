import { test, expect, Page } from '@playwright/test'
import { shoot } from '../helpers/screenshot'
import { loginMoodle, adminPassword } from '../helpers/auth'

const baseURL = `https://${process.env.PLAYWRIGHT_APP_DOMAIN}`
const username = 'admin'

test.describe.serial('moodle', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage({ ignoreHTTPSErrors: true })
    await loginMoodle(page, baseURL, username, adminPassword())
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('login', async ({ browser }, testInfo) => {
    const fresh = await browser.newPage({ ignoreHTTPSErrors: true })
    await fresh.goto(`${baseURL}/login/index.php`)
    await expect(fresh.locator('#loginbtn')).toBeVisible()
    await shoot(fresh, testInfo, 'login')
    await fresh.close()
  })

  test('dashboard', async ({}, testInfo) => {
    await page.goto('/my/')
    await expect(page).toHaveURL(/\/my\/?/)
    await expect(page.locator('#page')).toBeVisible()
    await shoot(page, testInfo, 'dashboard')
  })

  test('frontpage', async ({}, testInfo) => {
    await page.goto('/?redirect=0')
    await expect(page.locator('#page')).toBeVisible()
    await shoot(page, testInfo, 'frontpage')
  })

  test('site-administration', async ({}, testInfo) => {
    await page.goto('/admin/search.php')
    await expect(page.locator('#page')).toContainText('Site administration')
    await shoot(page, testInfo, 'site-administration')
  })

  test('course-management', async ({}, testInfo) => {
    await page.goto('/course/management.php')
    await expect(page.locator('#page')).toBeVisible()
    await shoot(page, testInfo, 'course-management')
  })

  test('users', async ({}, testInfo) => {
    await page.goto('/admin/user.php')
    await expect(page.locator('#page')).toBeVisible()
    await shoot(page, testInfo, 'users')
  })

  test('preferences', async ({}, testInfo) => {
    await page.goto('/user/preferences.php')
    await expect(page.locator('#page')).toBeVisible()
    await shoot(page, testInfo, 'preferences')
  })
})
