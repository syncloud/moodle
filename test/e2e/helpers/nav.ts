import { Page, expect } from '@playwright/test'

export async function primaryNav(page: Page, name: string) {
  await page.locator('.primary-navigation a', { hasText: name }).first().click()
}

export async function dismissTour(page: Page) {
  const step = page.locator('[data-role="flexitour-step"]')
  await step.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})
  if (!(await step.isVisible().catch(() => false))) return
  await step
    .getByRole('button', { name: 'End tour' })
    .or(step.locator('[data-role="end"]'))
    .first()
    .click()
  await expect(step).toBeHidden()
}

export async function openAdminCategory(page: Page, category: string) {
  await page.locator('.primary-navigation a', { hasText: 'Site administration' }).first().click()
  const tab = page.locator(`a[href*="#link${category}"]`).first()
  await tab.waitFor({ state: 'visible', timeout: 60_000 })
  await tab.click()
}

export async function openCoursesAdmin(page: Page) {
  await openAdminCategory(page, 'courses')
}

export async function openUsersAdmin(page: Page) {
  await openAdminCategory(page, 'users')
}

export async function openCourseManagement(page: Page) {
  await openCoursesAdmin(page)
  const manage = page.getByRole('link', { name: 'Manage courses and categories' }).first()
  await manage.waitFor({ state: 'visible', timeout: 60_000 })
  await manage.click()
}

export async function searchCourse(page: Page, shortname: string) {
  const search = page.locator('input[name="search"]').first()
  await search.waitFor({ state: 'visible', timeout: 60_000 })
  await search.fill(shortname)
  await search.press('Enter')
  await expect(search).toHaveValue(shortname, { timeout: 30_000 })
}
