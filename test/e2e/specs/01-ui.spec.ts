import { test, expect, Page } from '@playwright/test'
import { shoot } from '../helpers/screenshot'
import { adminPassword } from '../helpers/auth'
import { clickThroughTour } from '../helpers/nav'

const username = 'admin'

test.describe.serial('moodle', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage({ ignoreHTTPSErrors: true })
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('login', async ({}, testInfo) => {
    await page.goto('/')
    await shoot(page, testInfo, 'frontpage-guest')
    await page.getByRole('link', { name: 'Log in' }).first().click()
    await expect(page.locator('#loginbtn')).toBeVisible()
    await shoot(page, testInfo, 'login')
    await page.locator('#username').fill(username)
    await page.locator('#password').fill(adminPassword())
    await page.locator('#loginbtn').click()
    await page.waitForURL((url) => !url.pathname.includes('/login/'), { timeout: 60_000 })
    await expect(page.locator('#page')).toBeVisible()
  })

  test('tour', async ({}, testInfo) => {
    await expect(page.locator('[data-role="flexitour-step"]')).toBeVisible()
    await shoot(page, testInfo, 'tour')
    await clickThroughTour(page)
  })

  test('dashboard', async ({}, testInfo) => {
    await page.getByRole('link', { name: 'Dashboard' }).click()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('#page')).toBeVisible()
    await shoot(page, testInfo, 'dashboard')
  })

  test('site-home', async ({}, testInfo) => {
    await page.getByRole('link', { name: 'Home' }).first().click()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('#page')).toBeVisible()
    await shoot(page, testInfo, 'site-home')
  })

  test('site-administration', async ({}, testInfo) => {
    await page.getByRole('link', { name: 'Site administration' }).click()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('#page')).toContainText('Site administration')
    await shoot(page, testInfo, 'site-administration')
  })

  test('users', async ({}, testInfo) => {
    await page.getByRole('link', { name: 'Users', exact: true }).first().click()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('#page')).toBeVisible()
    await shoot(page, testInfo, 'users')
  })

  test('courses', async ({}, testInfo) => {
    await page.getByRole('link', { name: 'Courses', exact: true }).first().click()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('#page')).toBeVisible()
    await shoot(page, testInfo, 'courses')
  })

  test('preferences', async ({}, testInfo) => {
    await page.locator('#user-menu-toggle').click()
    await page.getByRole('link', { name: 'Preferences' }).click()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('#page')).toBeVisible()
    await shoot(page, testInfo, 'preferences')
  })
})
