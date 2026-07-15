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

  let courseId = ''

  test('create-course', async () => {
    await page.goto('/course/edit.php?category=1')
    await page.locator('#id_fullname').fill('Demo course')
    await page.locator('#id_shortname').fill('demo')
    await page.locator('#id_saveanddisplay').click()
    await page.waitForLoadState('networkidle')
    courseId = new URL(page.url()).searchParams.get('id') || ''
    expect(courseId).not.toEqual('')
    await shoot(page, 'course-created')
  })

  test('create-student', async () => {
    await page.goto('/user/editadvanced.php?id=-1')
    await page.locator('#id_username').fill('student')
    await page.getByText('Click to enter text').first().click()
    await page.locator('#id_newpassword').fill('Student1!syncloud')
    await page.locator('#id_firstname').fill('Demo')
    await page.locator('#id_lastname').fill('Student')
    await page.locator('#id_email').fill('student@example.com')
    await page.locator('#id_submitbutton').click()
    await page.waitForLoadState('networkidle')
    await shoot(page, 'student-created')
  })

  test('enrol-student', async () => {
    await page.goto('/user/index.php?id=' + courseId)
    await page.getByRole('button', { name: 'Enrol users' }).first().click()
    const modal = page.locator('.modal-content').last()
    const search = modal.locator('input[aria-autocomplete="list"]').first()
    await search.click()
    await search.pressSequentially('Demo', { delay: 100 })
    const option = page.getByRole('option', { name: /Demo Student/i }).first()
    await option.waitFor({ state: 'visible' })
    await option.click()
    await expect(modal.locator('.form-autocomplete-selection')).toContainText('Demo Student')
    await shoot(page, 'enrol-modal')
    await modal.getByRole('button', { name: /^Enrol users$/ }).click()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('#page')).toContainText('Demo Student')
    await shoot(page, 'student-enrolled')
  })

  test('student-view', async () => {
    await page.locator('a', { hasText: 'Demo Student' }).first().click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: 'Log in as' }).first().click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.waitForLoadState('networkidle')
    await page.goto('/course/view.php?id=' + courseId)
    await expect(page.locator('#page')).toContainText('Demo course')
    await shoot(page, 'student-course-view')
  })
})
