import { test, expect, Page } from '@playwright/test'
import * as path from 'node:path'
import { shoot, screenshotDir } from '../helpers/screenshot'
import { loginViaOidc, completeProfileIfNeeded } from '../helpers/auth'
import { clickThroughTour, primaryNav } from '../helpers/nav'

const username = process.env.PLAYWRIGHT_DEVICE_USER!
const password = process.env.PLAYWRIGHT_DEVICE_PASSWORD!

test.describe.serial('moodle', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage({ ignoreHTTPSErrors: true })
  })

  test.afterAll(async () => {
    await page.close()
  })

  test.afterEach(async ({}, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      await page
        .screenshot({ path: path.join(screenshotDir(), `${testInfo.title}-error.png`) })
        .catch(() => {})
    }
  })

  test('login', async () => {
    await page.goto('/')
    await shoot(page, 'frontpage-guest')
    await page.getByRole('link', { name: 'Log in' }).first().click()
    await page.waitForURL((url) => url.host.startsWith('auth.'), { timeout: 60_000 })
    await shoot(page, 'login')
    await loginViaOidc(page, username, password)
    await completeProfileIfNeeded(page)
    await expect(page.locator('#user-menu-toggle')).toBeVisible()
  })

  test('tour', async () => {
    await primaryNav(page, 'Dashboard')
    await expect(page.locator('[data-role="flexitour-step"]')).toBeVisible()
    await shoot(page, 'tour')
    await clickThroughTour(page)
  })

  test('dashboard', async () => {
    await primaryNav(page, 'Dashboard')
    await expect(page.locator('#page')).toBeVisible()
    await shoot(page, 'dashboard')
  })

  test('site-home', async () => {
    await primaryNav(page, 'Home')
    await expect(page.locator('#page')).toBeVisible()
    await shoot(page, 'site-home')
  })

  test('my-courses', async () => {
    await primaryNav(page, 'My courses')
    await expect(page.locator('#page')).toBeVisible()
    await shoot(page, 'my-courses')
  })

  test('site-administration', async () => {
    // the syncloud-group user must be a Moodle site admin
    await primaryNav(page, 'Site administration')
    await expect(page.locator('#page')).toContainText('Site administration')
    await shoot(page, 'site-administration')
  })

  test('preferences', async () => {
    await page.locator('#user-menu-toggle').click()
    await page.locator('#user-action-menu a[href*="/user/preferences.php"]').first().click()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('#page')).toBeVisible()
    await shoot(page, 'preferences')
  })
})
