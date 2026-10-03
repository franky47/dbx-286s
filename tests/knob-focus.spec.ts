import { expect, test } from '@playwright/test'

test('keyboard focus turns the knob edge red at twice its normal width', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Copy permalink' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Choose theme' })).toBeFocused()

  for (const dial of await page.getByRole('slider').all()) {
    const edge = dial.locator('circle[stroke="#73786a"]')
    await expect(edge).toHaveCSS('stroke', 'rgb(115, 120, 106)')
    await expect(edge).toHaveCSS('stroke-width', '1.2px')

    await page.keyboard.press('Tab')
    await expect(dial).toBeFocused()
    await expect(dial).toHaveCSS('outline-style', 'none')
    await expect(edge).toHaveCSS('stroke', 'rgb(157, 48, 32)')
    await expect(edge).toHaveCSS('stroke-width', '2.4px')

    await page.keyboard.press('Tab')
    await expect(edge).toHaveCSS('stroke', 'rgb(115, 120, 106)')
    await expect(edge).toHaveCSS('stroke-width', '1.2px')
    await page.keyboard.press('Shift+Tab')
  }
})
