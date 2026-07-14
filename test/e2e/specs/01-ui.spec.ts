import { test, expect, Page } from '@playwright/test'
import * as path from 'node:path'
import { shoot, screenshotDir } from '../helpers/screenshot'
import { adminPassword } from '../helpers/auth'
import { clickThroughTour, primaryNav, clickHref } from '../helpers/nav'

const username = 'admin'

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
    await expect(page.locator('#loginbtn')).toBeVisible()
    await shoot(page, 'login')
    await page.locator('#username').fill(username)
    await page.locator('#password').fill(adminPassword())
    await page.locator('#loginbtn').click()
    await page.waitForURL((url) => !url.pathname.includes('/login/'), { timeout: 60_000 })
    await expect(page.locator('#page')).toBeVisible()
  })

  test('tour', async () => {
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

  test('site-administration', async () => {
    await primaryNav(page, 'Site administration')
    await expect(page.locator('#page')).toContainText('Site administration')
    await shoot(page, 'site-administration')
  })

  test('users', async () => {
    await clickHref(page, '/admin/category.php?category=users')
    await expect(page.locator('#page')).toBeVisible()
    await shoot(page, 'users')
  })

  test('courses', async () => {
    await clickHref(page, '/admin/category.php?category=courses')
    await expect(page.locator('#page')).toBeVisible()
    await shoot(page, 'courses')
  })

  test('preferences', async () => {
    await page.locator('#user-menu-toggle').click()
    await clickHref(page, '/user/preferences.php')
    await expect(page.locator('#page')).toBeVisible()
    await shoot(page, 'preferences')
  })
})
