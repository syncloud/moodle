import { Page, expect } from '@playwright/test'

export async function clickThroughTour(page: Page) {
  const step = page.locator('[data-role="flexitour-step"]')
  await expect(step).toBeVisible()

  for (let guard = 0; guard < 30; guard++) {
    if (!(await step.isVisible().catch(() => false))) {
      await page.waitForTimeout(500)
      if (!(await step.isVisible().catch(() => false))) break
    }
    const next = step.locator('button[data-role="next"]')
    if (await next.isVisible().catch(() => false)) {
      await next.click()
    } else {
      await step.locator('button[data-role="end"]').click()
    }
    await page.waitForTimeout(400)
  }

  await expect(step).toBeHidden()
  await expect(page.locator('.tour-backdrop')).toHaveCount(0)
}

export async function primaryNav(page: Page, name: string) {
  await page.locator('.primary-navigation a', { hasText: name }).first().click()
  await page.waitForLoadState('networkidle')
}

export async function secondaryNav(page: Page, name: RegExp) {
  await page.locator('.secondary-navigation a', { hasText: name }).first().click()
  await page.waitForLoadState('networkidle')
}
