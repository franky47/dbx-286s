import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('the unit has ten audiocn knobs and no extra page sections', async ({ page }) => {
  await expect(page.getByRole('slider')).toHaveCount(10)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'DBX 286s mic preamp / processor',
  )
  await expect(page.getByRole('banner')).toHaveCount(0)
  await expect(page.getByRole('contentinfo')).toHaveCount(0)
  await expect(page.getByRole('combobox')).toHaveCount(0)
  await expect(page.getByText('Your voice.', { exact: false })).toHaveCount(0)
})

test('tab navigation skips the panel wrapper', async ({ page }) => {
  const gain = page.getByRole('slider', { name: 'Mic gain', exact: true })
  const theme = page.getByRole('button', { name: 'Choose theme', exact: true })

  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 })
    await gain.focus()
    await gain.press('Shift+Tab')
    await expect(theme).toBeFocused()
    await theme.press('Tab')
    await expect(gain).toBeFocused()
  }
})

test('knobs support keys, bounds, direct entry and reset', async ({ page }) => {
  const gain = page.getByRole('slider', { name: 'Mic gain', exact: true })
  await gain.focus()
  await gain.press('ArrowUp')
  await expect(gain).toHaveAttribute('aria-valuenow', '58.5')
  await gain.press('End')
  await expect(gain).toHaveAttribute('aria-valuenow', '60')
  await gain.press('Home')
  await expect(gain).toHaveAttribute('aria-valuenow', '0')
  await gain.press('Enter')
  await page.getByRole('textbox', { name: 'Value', exact: true }).fill('42')
  await page.getByRole('textbox', { name: 'Value', exact: true }).press('Enter')
  await expect(gain).toHaveAttribute('aria-valuenow', '42')
  await gain.dblclick()
  await expect(gain).toHaveAttribute('aria-valuenow', '57')
})

test('input gain dragging and fine keys stay on fixed positions', async ({ page }) => {
  const gain = page.getByRole('slider', { name: 'Mic gain', exact: true })
  const box = (await gain.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 20, { steps: 4 })
  await page.mouse.up()
  await expect(gain).toHaveAttribute('aria-valuenow', '51')
  await gain.press('Alt+ArrowUp')
  await expect(gain).toHaveAttribute('aria-valuenow', '52.5')
})

test('frequency input understands kHz and Escape cancels', async ({ page }) => {
  const frequency = page.getByRole('slider', { name: 'Frequency', exact: true })
  await frequency.press('Enter')
  const input = page.getByRole('textbox', { name: 'Value', exact: true })
  await input.fill('6.2 kHz')
  await input.press('Enter')
  await expect(frequency).toHaveAttribute('aria-valuenow', '6400')
  await frequency.press('Enter')
  await input.fill('9000')
  await input.press('Escape')
  await expect(frequency).toHaveAttribute('aria-valuenow', '6400')
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
  await expect(filter).toHaveAttribute('aria-pressed', 'true')
  await bypass.click()
  await expect(page.getByRole('slider', { name: 'Drive', exact: true })).toHaveAttribute(
    'aria-valuenow',
    '3.5',
  )
})

test('bypass dims processor labels, units and meters without dimming section groups', async ({
  page,
}) => {
  const labels = page.locator('.unit-face .control-label').filter({ hasNotText: /^GAIN$/ })
  const units = page.locator('.unit-face .control-unit').filter({ hasText: /^(Hz|dBu)$/ })
  const meters = page.getByRole('img', { name: /^(GAIN REDUCTION dB|dB|THRESHOLD) meter/ })
  await expect(labels).toHaveCount(8)
  await expect(units).toHaveCount(2)
  await expect(meters).toHaveCount(3)

  const dimmed = labels.or(units).or(meters).or(page.locator('.processor-knob'))
  const unchanged = page
    .locator(
      '.rack, .unit-face, .unit-face > g, .section-label, .panel-switch, .panel-knob:not(.processor-knob)',
    )
    .or(page.locator('.unit-face .control-label').filter({ hasText: /^GAIN$/ }))
    .or(page.locator('.unit-face .control-unit').filter({ hasText: /^dB$/ }))
    .or(page.getByRole('img', { name: /^(LEVEL|Clip)/ }))

  const bypass = page.getByRole('button', { name: 'Process bypass', exact: true })
  for (const opacity of ['0.5', '1']) {
    await bypass.click()
    for (const element of await dimmed.all()) {
      await expect(element).toHaveCSS('opacity', opacity)
    }
    for (const element of await unchanged.all()) {
      await expect(element).toHaveCSS('opacity', '1')
    }
    if (opacity === '0.5') {
      await page.getByRole('slider', { name: 'Drive', exact: true }).press('ArrowUp')
      await expect(page.getByRole('slider', { name: 'Drive', exact: true })).toHaveAttribute(
        'aria-valuenow',
        '3.75',
      )
    }
  }
})

test('mobile keeps the rack inside a scroll area and output is reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  const output = page.getByRole('slider', { name: 'Output gain', exact: true })
  await output.focus()
  await output.press('ArrowUp')
  await expect(output).toHaveAttribute('aria-valuenow', '2.5')
  await expect(output).toBeInViewport()
})
