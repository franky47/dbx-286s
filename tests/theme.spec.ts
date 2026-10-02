import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function chooseTheme(page: Page, name: string) {
  await page.getByRole('button', { name: 'Choose theme' }).click()
  await page.getByRole('menuitemradio', { name, exact: true }).click()
}

test('system follows the device, while explicit choices persist', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/?ingain=42')
  const root = page.locator('html')
  await expect(root).toHaveCSS('background-color', 'rgb(244, 243, 238)')
  const rack = await page.locator('.rack').innerHTML()

  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(root).toHaveCSS('background-color', 'rgb(16, 16, 17)')
  await chooseTheme(page, 'Light')
  await expect(root).toHaveCSS('background-color', 'rgb(244, 243, 238)')
  await page.reload()
  await expect(root).toHaveCSS('background-color', 'rgb(244, 243, 238)')
  await page.getByRole('button', { name: 'Choose theme' }).click()
  await expect(page.getByRole('menuitemradio', { name: 'Light', exact: true })).toBeChecked()
  await page.keyboard.press('Escape')

  await chooseTheme(page, 'Dark')
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(root).toHaveCSS('background-color', 'rgb(16, 16, 17)')
  await page.reload()
  await expect(root).toHaveCSS('background-color', 'rgb(16, 16, 17)')
  await chooseTheme(page, 'System')
  await expect(root).toHaveCSS('background-color', 'rgb(244, 243, 238)')
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(root).toHaveCSS('background-color', 'rgb(16, 16, 17)')
  await page.reload()
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(root).toHaveCSS('background-color', 'rgb(244, 243, 238)')
  expect(await page.locator('.rack').innerHTML()).toBe(rack)
  await expect(page).toHaveURL(/\?ingain=42$/)
})

test('theme menu supports the keyboard', async ({ page }) => {
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Choose theme' })
  await trigger.focus()
  await trigger.press('ArrowDown')
  await expect(page.getByRole('menu')).toBeVisible()
  await page.keyboard.press('Home')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveClass('dark')
  await expect(trigger).toBeFocused()
})

test('invalid saved themes fall back to the system theme', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('dbx-theme', 'invalid'))
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await expect(page.locator('html')).toHaveClass('dark')
  await page.getByRole('button', { name: 'Choose theme' }).click()
  await expect(page.getByRole('menuitemradio', { name: 'System', exact: true })).toBeChecked()
})

test('theme changes work when storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Storage blocked', 'SecurityError')
      },
    })
  })
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  await chooseTheme(page, 'Dark')
  await expect(page.locator('html')).toHaveClass('dark')
  await chooseTheme(page, 'Light')
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(244, 243, 238)')
})

for (const width of [390, 1440]) {
  test(`theme button is an icon at the top right at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/')
    const trigger = page.getByRole('button', { name: 'Choose theme' })
    await expect(trigger).toBeVisible()
    await expect(trigger).toHaveText('')
    await expect(trigger).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    const bounds = (await trigger.boundingBox())!
    expect(bounds.y).toBeLessThanOrEqual(24)
    expect(width - bounds.x - bounds.width).toBeLessThanOrEqual(24)
    await trigger.click()
    await expect(page.getByRole('menu')).toBeInViewport()
    await expect(page.getByRole('menuitemradio')).toHaveCount(3)
  })
}
