import { expect, test } from '@playwright/test'

test('header buttons keep their shadcn borders and type size', async ({ page }) => {
  await page.goto('/?ingain=36')
  for (const name of ['Copy permalink', 'Save as default']) {
    const button = page.getByRole('button', { name, exact: true })
    await expect(button).toHaveCSS('border-top-width', '1px')
    await expect(button).toHaveCSS('font-size', '12px')
  }
})

for (const width of [320, 390, 520, 800, 1440]) {
  test(`header stays visible and follows the agreed order at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 })
    await page.goto('/?ingain=36')
    const copy = page.getByRole('button', { name: 'Copy permalink' })
    const save = page.getByRole('button', { name: 'Save as default' })
    const reset = page.getByRole('button', { name: 'Reset', exact: true })
    const theme = page.getByRole('button', { name: 'Choose theme' })
    for (const button of [copy, save, reset, theme]) await expect(button).toBeInViewport()
    const c = (await copy.boundingBox())!
    const s = (await save.boundingBox())!
    const r = (await reset.boundingBox())!
    const t = (await theme.boundingBox())!
    expect(t.y).toBe(c.y)
    expect(t.x).toBeGreaterThan(c.x + c.width)
    expect(r.x).toBeGreaterThanOrEqual(s.x + s.width)
    expect(r.y).toBe(s.y)
    if (width <= 520) {
      expect(s.y).toBeGreaterThan(c.y + c.height)
    } else {
      expect(s.y).toBe(c.y)
      expect(s.x).toBeGreaterThan(c.x + c.width)
      expect(t.x).toBeGreaterThan(r.x + r.width)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    await page.locator('.rack-scroll').evaluate((node) => {
      node.scrollLeft = node.scrollWidth
    })
    expect(await copy.boundingBox()).toEqual(c)
  })
}
