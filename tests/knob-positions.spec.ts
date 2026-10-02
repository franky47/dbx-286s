import { expect, test } from '@playwright/test'

const controls = [
  { name: 'Mic gain', marks: [0, 15, 30, 45, 60] },
  { name: 'Drive', marks: [0, 2.5, 5, 7.5, 10] },
  { name: 'Density', marks: [0, 2.5, 5, 7.5, 10] },
  { name: 'Frequency', marks: [800, 1000, 4000, 8000, 10000] },
  { name: 'De-esser threshold', marks: [0, 2.5, 5, 7.5, 10] },
  { name: 'LF detail', marks: [0, 2.5, 5, 7.5, 10] },
  { name: 'HF detail', marks: [0, 2.5, 5, 7.5, 10] },
  { name: 'Gate threshold', marks: [-60, -30, -15, -5, 15] },
  { name: 'Ratio', marks: [1, 1.5, 2, 5, 10] },
  { name: 'Output gain', marks: [-30, -10, 0, 5, 10] },
]

for (const { name, marks } of controls) {
  test(`${name} has 41 fixed positions and retains its scale`, async ({ page }) => {
    await page.goto('/')
    const dial = page.getByRole('slider', { name, exact: true })
    const angle = () =>
      dial.evaluate((element) =>
        parseFloat((element as HTMLElement).style.getPropertyValue('--knob-angle')),
      )
    const start = await dial.getAttribute('aria-valuenow')
    expect(((await angle()) + 150) / 7.5).toBeCloseTo(Math.round(((await angle()) + 150) / 7.5))
    const labels = await dial.locator('[data-slot="unit-scale-label"]').allTextContents()
    await expect(dial).toHaveAttribute('aria-valuemin', String(marks[0]))
    await expect(dial).toHaveAttribute('aria-valuemax', String(marks[4]))
    await dial.press('Home')
    for (let index = 0; index <= 40; index += 1) {
      const quarter = Math.min(3, Math.floor(index / 10))
      const value =
        marks[quarter] + (marks[quarter + 1] - marks[quarter]) * ((index - quarter * 10) / 10)
      expect(Number(await dial.getAttribute('aria-valuenow'))).toBeCloseTo(value, 6)
      await expect(dial).toHaveCSS('--knob-angle', `${-150 + index * 7.5}deg`)
      await dial.press('ArrowUp')
    }
    await expect(dial).toHaveAttribute('aria-valuenow', String(marks[4]))
    await dial.press('Home')
    await dial.press('ArrowDown')
    await expect(dial).toHaveAttribute('aria-valuenow', String(marks[0]))
    await dial.press('Alt+ArrowUp')
    await expect(dial).toHaveCSS('--knob-angle', '-142.5deg')
    await dial.press('PageUp')
    await expect(dial).toHaveCSS('--knob-angle', '-67.5deg')
    await dial.press('Shift+ArrowDown')
    await expect(dial).toHaveCSS('--knob-angle', '-142.5deg')

    for (const modifiers of [{}, { shiftKey: true }, { altKey: true }]) {
      await dial.press('Home')
      await dial.dispatchEvent('wheel', { deltaY: -100, ...modifiers })
      await expect(dial).toHaveCSS('--knob-angle', '-142.5deg')
    }

    await dial.press('Enter')
    const input = page.getByRole('textbox', { name: 'Value', exact: true })
    await input.fill(String(marks[0] + (marks[1] - marks[0]) * 0.14))
    await input.press('Enter')
    await expect(dial).toHaveCSS('--knob-angle', '-142.5deg')

    await dial.press('Home')
    const box = (await dial.boundingBox())!
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, y - 50, { steps: 10 })
    await page.mouse.up()
    await expect(dial).toHaveCSS('--knob-angle', '-75deg')
    await expect(dial).toHaveAttribute('aria-valuenow', String(marks[1]))

    await dial.press('Home')
    await page.keyboard.down('Shift')
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, y - 30, { steps: 6 })
    await page.mouse.up()
    await page.keyboard.up('Shift')
    await expect(dial).toHaveCSS('--knob-angle', '-142.5deg')
    await dial.dblclick()
    await expect(dial).toHaveAttribute('aria-valuenow', start!)
    await expect(dial.locator('[data-slot="unit-scale-label"]')).toHaveText(labels)
  })
}

test('ratio positions below 1.5 keep their value when confirmed without edits', async ({
  page,
}) => {
  await page.goto('/')
  const dial = page.getByRole('slider', { name: 'Ratio', exact: true })
  await dial.press('Home')
  await expect(dial).toHaveAttribute('aria-valuetext', 'MIN')
  for (let index = 1; index < 10; index += 1) {
    await dial.press('ArrowUp')
    const value = String(Number((1 + index * 0.05).toFixed(2)))
    await expect(dial).toHaveAttribute('aria-valuenow', value)
    await expect(dial).toHaveAttribute('aria-valuetext', `${Number(value).toFixed(2)}:1`)
    await dial.press('Enter')
    const input = page.getByRole('textbox', { name: 'Value', exact: true })
    await expect(input).toHaveValue(`${Number(value).toFixed(2)}:1`)
    await input.press('Enter')
    await expect(dial).toHaveAttribute('aria-valuenow', value)
  }
})

test('all knobs stay silent', async ({ page }) => {
  await page.addInitScript(() => {
    Object.assign(window, { audioStarts: 0 })
    const start = AudioBufferSourceNode.prototype.start
    AudioBufferSourceNode.prototype.start = function (...args) {
      Reflect.set(window, 'audioStarts', Number(Reflect.get(window, 'audioStarts')) + 1)
      start.apply(this, args)
    }
  })
  await page.goto('/')
  for (const { name } of controls) {
    const dial = page.getByRole('slider', { name, exact: true })
    await dial.press('ArrowUp')
    await dial.press('Home')
    await dial.press('End')
    await dial.dblclick()
  }
  expect(await page.evaluate(() => Reflect.get(window, 'audioStarts'))).toBe(0)
})
