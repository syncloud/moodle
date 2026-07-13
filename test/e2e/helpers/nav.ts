import { Page, expect } from '@playwright/test'

export async function clickThroughTour(page: Page) {
  const step = page.locator('[data-role="flexitour-step"]')
  await expect(step).toBeVisible()

  for (let i = 0; i < 12; i++) {
    if (!(await step.isVisible().catch(() => false))) break
    const next = step.locator('button[data-role="next"]')
    const end = step.locator('button[data-role="end"]')
    if (await next.isVisible().catch(() => false)) {
      await next.click()
    } else {
      await end.click()
      break
    }
    await page.waitForTimeout(400)
  }

  await expect(step).toBeHidden()
}
