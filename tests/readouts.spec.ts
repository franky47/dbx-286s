import { expect, test } from '@playwright/test'

const decimalPlaces: Record<string, number> = {
  'Mic gain': 1,
  Drive: 2,
  Density: 2,
  Frequency: 2,
  'De-esser threshold': 2,
  'LF detail': 2,
  'HF detail': 2,
  'Gate threshold': 1,
  Ratio: 2,
  'Output gain': 1,
}

for (const width of [1280, 1980]) {
  test(`knob readouts keep their width and right alignment at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)

    for (const knob of await page.locator('.panel-knob').all()) {
      const dial = knob.getByRole('slider')
      const readout = knob.locator('[data-slot="knob-value"]')
      await dial.press('Home')
      const initial = (await readout.boundingBox())!
      const label = await knob.locator('[data-slot="knob-label"]').innerText()
      let widestText = 0

      for (let position = 0; position < 41; position += 1) {
        if (position > 0) await dial.press('ArrowUp')
        const box = (await readout.boundingBox())!
        expect(box.width).toBeCloseTo(initial.width, 2)
        expect(box.x).toBeCloseTo(initial.x, 2)
        await expect(readout).toHaveCSS('text-align', 'right')
        const value = await readout.innerText()
        if (value !== 'OFF' && value !== 'MIN') {
          expect(value.match(/^[+-]?\d+\.(\d+)/)?.[1]).toHaveLength(decimalPlaces[label])
        }
        const { textWidth, contentWidth } = await readout.evaluate((element) => {
          const text = document.createRange()
          text.selectNodeContents(element)
          const style = getComputedStyle(element)
          return {
            textWidth: text.getBoundingClientRect().width,
            contentWidth:
              element.getBoundingClientRect().width -
              parseFloat(style.paddingLeft) -
              parseFloat(style.paddingRight),
          }
        })
        expect(textWidth).toBeLessThanOrEqual(contentWidth + 0.1)
        widestText = Math.max(widestText, textWidth)
      }
      expect(Math.abs(initial.width - widestText - 12)).toBeLessThan(0.2)

      await dial.press('Enter')
      const input = knob.getByRole('textbox', { name: 'Value', exact: true })
      await expect(input).toBeVisible()
      await expect(input).toHaveCSS('text-align', 'right')
      const editor = (await input.boundingBox())!
      expect(editor.width).toBeCloseTo(initial.width, 2)
      expect(editor.x).toBeCloseTo(initial.x, 2)
      await input.press('Escape')
    }
  })
}
