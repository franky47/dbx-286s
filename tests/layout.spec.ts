import { expect, test } from '@playwright/test'
import type { Locator } from '@playwright/test'

async function box(locator: Locator) {
  return (await locator.boundingBox())!
}

for (const width of [1440, 1980]) {
  test(`labels and controls have clearance at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    const rack = await box(page.locator('.rack'))
    const unit = rack.width / 1980
    const x = (coordinate: number) => rack.x + coordinate * unit

    for (const [name, label, border] of [
      ['48V phantom power', 'PHANTOM', 515],
      ['80 Hz high-pass filter', 'HIGH-PASS', 515],
      ['Process bypass', 'PROCESS', 590],
    ] as const) {
      const button = page.getByRole('button', { name, exact: true })
      const key = await box(button.locator('.switch-key'))
      const led = await box(button.locator('.led'))
      const text = await box(
        page.locator('.switch-label').filter({ hasText: new RegExp(`^${label}$`) }),
      )
      const center = (key.x + led.x + led.width) / 2
      expect(Math.abs(text.x + text.width / 2 - center)).toBeLessThan(unit)
      expect(led.x + led.width).toBeLessThan(x(border - 8))
      expect(led.x - (key.x + key.width)).toBeLessThan(14 * unit)
    }

    for (const [name, left, right] of [
      ['LF detail', 1240, 1442],
      ['HF detail', 1240, 1442],
      ['Gate threshold', 1448, 1693],
      ['Ratio', 1448, 1693],
      ['Output gain', 1698, 1830],
    ] as const) {
      const labels = page
        .getByRole('slider', { name, exact: true })
        .locator('[data-slot="unit-scale-label"]')
      for (const label of await labels.all()) {
        const bounds = await box(label)
        expect(bounds.x).toBeGreaterThan(x(left + 3))
        expect(bounds.x + bounds.width).toBeLessThan(x(right - 3))
      }
    }

    const threshold = await box(
      page
        .getByRole('slider', { name: 'Gate threshold', exact: true })
        .locator('text')
        .filter({ hasText: /^-5$/ }),
    )
    const ratio = await box(
      page
        .getByRole('slider', { name: 'Ratio', exact: true })
        .locator('text')
        .filter({ hasText: /^1\.5:1$/ }),
    )
    expect(ratio.x - (threshold.x + threshold.width)).toBeGreaterThan(4 * unit)

    for (const [name, label, meterIndex] of [
      ['Ratio', '10:1', 3],
      ['Output gain', '+10', 4],
    ] as const) {
      const endLabel = await box(
        page.getByRole('slider', { name, exact: true }).locator('text').filter({ hasText: label }),
      )
      const meter = await box(page.locator('.meter').nth(meterIndex))
      expect(meter.x - (endLabel.x + endLabel.width)).toBeGreaterThan(2 * unit)
    }

    const gateTitle = await box(page.locator('.meter-title').filter({ hasText: /^THRESHOLD$/ }))
    expect(gateTitle.x).toBeGreaterThan(x(1650))
    expect(gateTitle.x + gateTitle.width).toBeLessThan(x(1691))

    const lowEight = await box(
      page
        .getByRole('slider', { name: 'LF detail', exact: true })
        .locator('text')
        .filter({ hasText: /^8$/ }),
    )
    const highTwo = await box(
      page
        .getByRole('slider', { name: 'HF detail', exact: true })
        .locator('text')
        .filter({ hasText: /^2$/ }),
    )
    expect(highTwo.x - (lowEight.x + lowEight.width)).toBeGreaterThan(3 * unit)
  })
}
