import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('input gain has 41 positions from 0 to +60 dB', async ({ page }) => {
  const gain = page.getByRole('slider', { name: 'Mic gain', exact: true })
  await gain.press('Home')
  for (let position = 1; position <= 41; position += 1) {
    const value = (position - 1) * 1.5
    await expect(gain).toHaveAttribute('aria-valuenow', String(value))
    await expect(gain).toHaveCSS('--knob-angle', `${-150 + (position - 1) * 7.5}deg`)
    await gain.press('ArrowUp')
  }
  await expect(gain).toHaveAttribute('aria-valuenow', '60')
  await gain.press('Home')
  await gain.press('ArrowDown')
  await expect(gain).toHaveAttribute('aria-valuenow', '0')
})

test('typed gain snaps to a position and reset restores a valid position', async ({ page }) => {
  const gain = page.getByRole('slider', { name: 'Mic gain', exact: true })
  for (const [typed, expected] of [
    ['35', '34.5'],
    ['100', '60'],
    ['-10', '0'],
  ]) {
    await gain.press('Enter')
    const input = page.getByRole('textbox', { name: 'Value', exact: true })
    await input.fill(typed)
    await input.press('Enter')
    await expect(gain).toHaveAttribute('aria-valuenow', expected)
  }
  await gain.dblclick()
  await expect(gain).toHaveAttribute('aria-valuenow', '34.5')
  await expect(gain).toHaveAttribute('aria-valuetext', '+34.5 dB')
})

test('fine drag and wheel cannot select values between gain positions', async ({ page }) => {
  const gain = page.getByRole('slider', { name: 'Mic gain', exact: true })
  await gain.press('Home')
  const box = (await gain.boundingBox())!
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.keyboard.down('Shift')
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x, y - 30, { steps: 6 })
  await page.mouse.up()
  await page.keyboard.up('Shift')
  await expect(gain).toHaveAttribute('aria-valuenow', '1.5')

  for (const modifiers of [{}, { shiftKey: true }, { altKey: true }]) {
    await gain.press('Home')
    await gain.dispatchEvent('wheel', { deltaY: -100, ...modifiers })
    await expect(gain).toHaveAttribute('aria-valuenow', '1.5')
  }
})
