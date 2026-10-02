import { expect, test } from '@playwright/test'

const cases = [
  { name: 'Mic gain', value: '30', label: '+30', angle: 0 },
  { name: 'Drive', value: '5', label: '5', angle: 0 },
  { name: 'Frequency', value: '4k', label: '4k', angle: 0 },
  { name: 'Frequency', value: '1k', label: '1k', angle: -75 },
  { name: 'Gate threshold', value: '-15', label: '-15', angle: 0 },
  { name: 'Ratio', value: '2:1', label: '2:1', angle: 0 },
  { name: 'Output gain', value: '0', label: '0', angle: 0 },
  { name: 'Output gain', value: '+5', label: '+5', angle: 75 },
]

for (const { name, value, label, angle } of cases) {
  test(`${name} ${value} aligns with its printed mark`, async ({ page }) => {
    await page.goto('/')
    const dial = page.getByRole('slider', { name, exact: true })
    await dial.press('Enter')
    const input = page.getByRole('textbox', { name: 'Value', exact: true })
    await input.fill(value)
    await input.press('Enter')
    await expect(dial).toHaveCSS('--knob-angle', `${angle}deg`)
    await expect(
      dial.locator('[data-slot="unit-scale-label"]', {
        hasText: new RegExp(`^${label.replaceAll('+', '\\+')}$`),
      }),
    ).toHaveCount(1)
  })
}

test('OFF and MIN can be entered as printed on the panel', async ({ page }) => {
  await page.goto('/')
  for (const [name, value] of [
    ['Gate threshold', 'OFF'],
    ['Drive', 'OFF'],
    ['Ratio', 'MIN'],
  ]) {
    const dial = page.getByRole('slider', { name, exact: true })
    await dial.press('Enter')
    const input = page.getByRole('textbox', { name: 'Value', exact: true })
    await input.fill(value)
    await input.press('Enter')
    await expect(dial).toHaveAttribute('aria-valuetext', value)
    await expect(dial).toHaveCSS('--knob-angle', '-150deg')
  }
})

test('photographed meter labels and dual gain scale are present', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.meter').nth(0).locator('.meter-segment > span')).toHaveText([
    '-20',
    '-10',
    '0',
    'CLIP',
  ])
  await expect(page.locator('.meter').nth(1).locator('.meter-segment > span')).toHaveText([
    '30',
    '25',
    '20',
    '15',
    '12',
    '9',
    '6',
    '3',
  ])
  await expect(
    page.getByRole('slider', { name: 'Mic gain', exact: true }).locator('.line-scale-label'),
  ).toHaveText(['-15', '0', '+15', '+30', '+45'])
})
