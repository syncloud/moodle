import { test, expect, Page } from '@playwright/test'
import * as path from 'node:path'
import { shoot, screenshotDir } from '../helpers/screenshot'
import { loginViaOidc, completeProfileIfNeeded, ensureAdminNav } from '../helpers/auth'
import { primaryNav, openCoursesAdmin, openUsersAdmin, openCourseManagement, searchCourse, dismissTour } from '../helpers/nav'

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
    await loginViaOidc(page, username, password)
    await completeProfileIfNeeded(page)
    await expect(page.locator('#user-menu-toggle')).toBeVisible()
    await dismissTour(page)
    await ensureAdminNav(page)
  })

  test('tour', async () => {
    await primaryNav(page, 'Dashboard')
    await dismissTour(page)
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
    await shoot(page, 'tour')
  })

  test('dashboard', async () => {
    await primaryNav(page, 'Dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
    await shoot(page, 'dashboard')
  })

  test('site-home', async () => {
    await primaryNav(page, 'Home')
    await expect(page.getByRole('heading', { name: 'Syncloud Moodle' })).toBeVisible()
    await shoot(page, 'site-home')
  })

  test('my-courses', async () => {
    await primaryNav(page, 'My courses')
    await expect(page.getByRole('heading', { name: 'My courses', level: 1 })).toBeVisible()
    await shoot(page, 'my-courses')
  })

  test('site-administration', async () => {
    await primaryNav(page, 'Site administration')
    await expect(page.getByRole('heading', { name: 'Site administration', level: 1 })).toBeVisible()
    await shoot(page, 'site-administration')
  })

  test('preferences', async () => {
    await page.locator('#user-menu-toggle').click()
    const pref = page.locator('#user-action-menu a[href*="/user/preferences.php"]').first()
    await pref.waitFor({ state: 'visible', timeout: 30_000 })
    await pref.click()
    await expect(page.getByRole('heading', { name: 'Preferences' })).toBeVisible()
    await shoot(page, 'preferences')
  })

  let courseId = ''

  test('create-course', async () => {
    await openCoursesAdmin(page)
    const add = page.getByRole('link', { name: 'Add a new course' }).first()
    await add.waitFor({ state: 'visible', timeout: 60_000 })
    await add.click()
    const fullname = page.locator('#id_fullname')
    await fullname.waitFor({ state: 'visible', timeout: 60_000 })
    await fullname.fill('Demo course')
    await page.locator('#id_shortname').fill('demo')
    await page.locator('#id_saveanddisplay').click()
    await expect(page.getByRole('heading', { name: 'Demo course' })).toBeVisible()
    await dismissTour(page)
    courseId = new URL(page.url()).searchParams.get('id') || ''
    expect(courseId).not.toEqual('')
    await shoot(page, 'course-created')
  })

  test('create-student', async () => {
    await openUsersAdmin(page)
    const add = page.getByRole('link', { name: 'Add a new user' }).first()
    await add.waitFor({ state: 'visible', timeout: 60_000 })
    await add.click()
    const uname = page.locator('#id_username')
    await uname.waitFor({ state: 'visible', timeout: 60_000 })
    await uname.fill('student')
    const newpassword = page.locator('#id_newpassword')
    await expect(async () => {
      if (!(await newpassword.isVisible().catch(() => false))) {
        await page.getByText('Click to enter text').first().click()
      }
      await expect(newpassword).toBeVisible({ timeout: 2_000 })
    }).toPass({ timeout: 30_000 })
    await newpassword.fill('Student1!syncloud')
    await page.locator('#id_firstname').fill('Demo')
    await page.locator('#id_lastname').fill('Student')
    await page.locator('#id_email').fill('student@example.com')
    await page.locator('#id_submitbutton').click()
    await expect(page.locator('#page')).toContainText('Demo Student')
    await shoot(page, 'student-created')
  })

  test('enrol-student', async () => {
    await openCourseManagement(page)
    await searchCourse(page, 'demo')
    await page.getByRole('link', { name: 'Demo course' }).first().click()
    const view = page.locator('a[href*="/course/view.php?id="]').first()
    await view.waitFor({ state: 'visible', timeout: 60_000 })
    await view.click()
    await dismissTour(page)
    const participants = page.locator('a[href*="/user/index.php?id="]').first()
    await participants.waitFor({ state: 'visible', timeout: 60_000 })
    await participants.click()
    const enrolBtn = page.getByRole('button', { name: 'Enrol users' }).first()
    await enrolBtn.waitFor({ state: 'visible', timeout: 60_000 })
    await enrolBtn.click()
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
    await expect(page.locator('#page')).toContainText('Demo Student')
    await shoot(page, 'student-enrolled')
  })

  test('student-view', async () => {
    await page.locator('a', { hasText: 'Demo Student' }).first().click()
    const loginAs = page.getByRole('link', { name: 'Log in as' }).first()
    await loginAs.waitFor({ state: 'visible', timeout: 60_000 })
    await loginAs.click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await dismissTour(page)
    await primaryNav(page, 'My courses')
    const course = page.getByRole('link', { name: 'Demo course' }).first()
    await course.waitFor({ state: 'visible', timeout: 60_000 })
    await course.click()
    await expect(page.getByRole('heading', { name: 'Demo course' })).toBeVisible()
    await shoot(page, 'student-course-view')
  })
})
