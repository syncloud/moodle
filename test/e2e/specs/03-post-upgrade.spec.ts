import { test, expect, Page } from '@playwright/test'
import * as path from 'node:path'
import { shoot, screenshotDir } from '../helpers/screenshot'
import { loginViaOidc, completeProfileIfNeeded, ensureAdminNav } from '../helpers/auth'
import { openCourseManagement, searchCourse, dismissTour } from '../helpers/nav'

const username = process.env.PLAYWRIGHT_DEVICE_USER!
const password = process.env.PLAYWRIGHT_DEVICE_PASSWORD!

const COURSE_FULLNAME = 'Upgrade course'
const COURSE_SHORTNAME = 'upgrade'

test.describe.serial('moodle post-upgrade', () => {
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
    await loginViaOidc(page, username, password)
    await completeProfileIfNeeded(page)
    await expect(page.locator('#user-menu-toggle')).toBeVisible()
    await dismissTour(page)
    await ensureAdminNav(page)
    await shoot(page, 'post-upgrade-login')
  })

  test('course-survived', async () => {
    await openCourseManagement(page)
    await searchCourse(page, COURSE_SHORTNAME)
    await expect(page.getByRole('link', { name: COURSE_FULLNAME })).toBeVisible()
    await shoot(page, 'post-upgrade-course')
  })
})
