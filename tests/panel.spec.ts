import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('only the unit is shown, with ten audiocn knobs', async ({ page }) => {
  await expect(page.getByRole('slider')).toHaveCount(10)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'DBX 286s mic preamp / processor',
  )
  await expect(page.getByRole('banner')).toHaveCount(0)
  await expect(page.getByRole('contentinfo')).toHaveCount(0)
  await expect(page.getByRole('combobox')).toHaveCount(0)
  await expect(page.getByText('Your voice.', { exact: false })).toHaveCount(0)
})

test('knobs support keys, bounds, direct entry and reset', async ({ page }) => {
  const gain = page.getByRole('slider', { name: 'Mic gain', exact: true })
  await gain.focus()
  await gain.press('ArrowUp')
  await expect(gain).toHaveAttribute('aria-valuenow', '36')
  await gain.press('End')
  await expect(gain).toHaveAttribute('aria-valuenow', '60')
  await gain.press('Home')
  await expect(gain).toHaveAttribute('aria-valuenow', '0')
  await gain.press('Enter')
  await page.getByRole('textbox', { name: 'Value', exact: true }).fill('42')
  await page.getByRole('textbox', { name: 'Value', exact: true }).press('Enter')
  await expect(gain).toHaveAttribute('aria-valuenow', '42')
  await gain.dblclick()
  await expect(gain).toHaveAttribute('aria-valuenow', '35')
})

test('knobs support dragging and fine adjustments', async ({ page }) => {
  const gain = page.getByRole('slider', { name: 'Mic gain', exact: true })
  const box = (await gain.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 20, { steps: 4 })
  await page.mouse.up()
  await expect(gain).toHaveAttribute('aria-valuenow', '41')
  await gain.press('Alt+ArrowUp')
  await expect(gain).toHaveAttribute('aria-valuenow', '41.1')
})

test('frequency input understands kHz and Escape cancels', async ({ page }) => {
  const frequency = page.getByRole('slider', { name: 'Frequency', exact: true })
  await frequency.press('Enter')
  const input = page.getByRole('textbox', { name: 'Value', exact: true })
  await input.fill('6.2 kHz')
  await input.press('Enter')
  await expect(frequency).toHaveAttribute('aria-valuenow', '6200')
  await frequency.press('Enter')
  await input.fill('9000')
  await input.press('Escape')
  await expect(frequency).toHaveAttribute('aria-valuenow', '6200')
})

test('switches update state and bypass keeps knob settings', async ({ page }) => {
  const bypass = page.getByRole('button', { name: 'Process bypass', exact: true })
  await bypass.click()
  await expect(bypass).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.rack')).toHaveAttribute('data-bypassed', 'true')
  const phantom = page.getByRole('button', { name: '48V phantom power' })
  await phantom.click()
  await expect(phantom).toHaveAttribute('aria-pressed', 'true')
  const filter = page.getByRole('button', { name: '80 Hz high-pass filter' })
  await filter.click()
  await expect(filter).toHaveAttribute('aria-pressed', 'false')
  await bypass.click()
  await expect(page.getByRole('slider', { name: 'Drive', exact: true })).toHaveAttribute(
    'aria-valuenow',
    '3',
  )
})

test('mobile keeps the rack inside a scroll area and output is reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  const output = page.getByRole('slider', { name: 'Output gain', exact: true })
  await output.focus()
  await output.press('ArrowUp')
  await expect(output).toHaveAttribute('aria-valuenow', '1')
  await expect(output).toBeInViewport()
})
