import { test, expect, Page } from '@playwright/test'
import * as path from 'node:path'
import { shoot, screenshotDir } from '../helpers/screenshot'
import { loginViaOidc, completeProfileIfNeeded, ensureAdminNav } from '../helpers/auth'
import { openCoursesAdmin, openCourseManagement, searchCourse, dismissTour } from '../helpers/nav'

const username = process.env.PLAYWRIGHT_DEVICE_USER!
const password = process.env.PLAYWRIGHT_DEVICE_PASSWORD!

const COURSE_FULLNAME = 'Upgrade course'
const COURSE_SHORTNAME = 'upgrade'

test.describe.serial('moodle pre-upgrade', () => {
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
    await shoot(page, 'pre-upgrade-login')
  })

  test('create-course', async () => {
    await openCourseManagement(page)
    await searchCourse(page, COURSE_SHORTNAME)
    if (await page.getByRole('link', { name: COURSE_FULLNAME }).first().isVisible().catch(() => false)) {
      await shoot(page, 'pre-upgrade-course-exists')
      return
    }

    await openCoursesAdmin(page)
    const add = page.getByRole('link', { name: 'Add a new course' }).first()
    await add.waitFor({ state: 'visible', timeout: 60_000 })
    await add.click()

    const fullname = page.locator('#id_fullname')
    await fullname.waitFor({ state: 'visible', timeout: 60_000 })
    await fullname.fill(COURSE_FULLNAME)
    await page.locator('#id_shortname').fill(COURSE_SHORTNAME)
    await page.locator('#id_saveanddisplay').click()
    await expect(page.locator('#page')).toContainText(COURSE_FULLNAME)
    await shoot(page, 'pre-upgrade-course-created')
  })
})
