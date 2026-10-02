import { expect, test } from '@playwright/test'
import { controls } from '../src/lib/controls'
import type { ControlId } from '../src/lib/controls'
import { graduations, graduationTaper } from '../src/lib/graduations'

for (const id of Object.keys(controls) as ControlId[]) {
  test(`${id} taper matches all marks and round-trips intermediate values`, () => {
    const taper = graduationTaper(id)
    for (const mark of graduations[id]) {
      expect(taper.toPosition(mark.value)).toBeCloseTo(mark.position)
      expect(taper.toValue(mark.position)).toBeCloseTo(mark.value)
    }
    for (let step = 0; step <= 100; step += 1) {
      const position = step / 100
      expect(taper.toPosition(taper.toValue(position))).toBeCloseTo(position)
    }
    expect(taper.toValue(-1)).toBe(controls[id].min)
    expect(taper.toValue(2)).toBe(controls[id].max)
    expect(taper.toPosition(controls[id].min - 1)).toBe(0)
    expect(taper.toPosition(controls[id].max + 1)).toBe(1)
  })
}

test('frequency drag follows the printed spacing', async ({ page }) => {
  await page.goto('/')
  const dial = page.getByRole('slider', { name: 'Frequency', exact: true })
  await dial.press('Home')
  const box = (await dial.boundingBox())!
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x, y - 50, { steps: 5 })
  await page.mouse.up()
  await expect(dial).toHaveAttribute('aria-valuenow', '1000')
  await expect(dial).toHaveCSS('--knob-angle', '-75deg')
})
