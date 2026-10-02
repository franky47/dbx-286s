import { expect, test } from '@playwright/test'
import { settingsParsers } from '../src/lib/query-state'

test('on/off parser uses booleans with an off default', () => {
  const parser = settingsParsers.phantom
  expect(parser.parse('on')).toBe(true)
  expect(parser.parse('off')).toBe(false)
  expect(parser.serialize(true)).toBe('on')
  expect(parser.serialize(false)).toBe('off')
  expect(parser.defaultValue).toBe(false)
  for (const value of ['', 'true', 'false', '1', '0', 'ON', 'OFF', 'invalid']) {
    expect(parser.parse(value)).toBeNull()
  }
})

const knobs = [
  { name: 'Mic gain', key: 'ingain', value: '36', max: '60', initial: '57' },
  { name: 'Drive', key: 'drive', value: '3.25', max: '10', initial: '3.5' },
  { name: 'Density', key: 'density', value: '4.25', max: '10', initial: '5.25' },
  { name: 'Frequency', key: 'deessfreq', value: '6400', max: '10000', initial: '7200' },
  { name: 'De-esser threshold', key: 'deessthresh', value: '5.25', max: '10', initial: '2.5' },
  { name: 'LF detail', key: 'lfdetail', value: '2.25', max: '10', initial: '3' },
  { name: 'HF detail', key: 'hfdetail', value: '3.25', max: '10', initial: '2.25' },
  { name: 'Gate threshold', key: 'gatethresh', value: '-33', max: '15', initial: '-45' },
  { name: 'Ratio', key: 'gateratio', value: '2.3', max: '10', initial: '1.3' },
  { name: 'Output gain', key: 'outgain', value: '0.5', max: '10', initial: '2' },
]

const switches = [
  { name: '48V phantom power', key: '48v' },
  { name: '80 Hz high-pass filter', key: 'hp' },
  { name: 'Process bypass', key: 'bypass' },
]

test('starts with the default preset without query parameters', async ({ page }) => {
  await page.goto('/')
  for (const { name, initial } of knobs) {
    await expect(page.getByRole('slider', { name, exact: true })).toHaveAttribute(
      'aria-valuenow',
      initial,
    )
  }
  await expect(page).toHaveURL((url) => url.search === '')
})

test('loads every control from a shared URL and keeps values on reload', async ({ page }) => {
  const params = new URLSearchParams([
    ...knobs.map(({ key, value }) => [key, value]),
    ...switches.map(({ key }) => [key, 'on']),
  ])
  await page.goto(`/?${params}`)
  for (let load = 0; load < 2; load++) {
    for (const { name, value } of knobs) {
      await expect(page.getByRole('slider', { name, exact: true })).toHaveAttribute(
        'aria-valuenow',
        value,
      )
    }
    for (const { name } of switches) {
      await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    }
    await expect(page.locator('.rack')).toHaveAttribute('data-bypassed', 'true')
    if (load === 0) await page.reload()
  }
})

test('knobs write mapped URL keys and reset clears defaults', async ({ page }) => {
  await page.goto('/?keep=value#panel')
  for (const { name } of knobs) {
    await page.getByRole('slider', { name, exact: true }).press('End')
  }
  await expect(page).toHaveURL((url) =>
    knobs.every(({ key, max }) => url.searchParams.get(key) === max),
  )
  await page.reload()
  for (const { name, max, initial } of knobs) {
    const knob = page.getByRole('slider', { name, exact: true })
    await expect(knob).toHaveAttribute('aria-valuenow', max)
    await knob.dblclick()
    await expect(knob).toHaveAttribute('aria-valuenow', initial)
  }
  await expect(page).toHaveURL(/\/\?keep=value#panel$/)
})

test('switches default off and write on with the mapped keys', async ({ page }) => {
  await page.goto('/')
  for (const { name, key } of switches) {
    const button = page.getByRole('button', { name, exact: true })
    await expect(button).toHaveAttribute('aria-pressed', 'false')
    await button.click()
    await expect(page).toHaveURL((url) => url.searchParams.get(key) === 'on')
  }
  await page.reload()
  for (const { name, key } of switches) {
    const button = page.getByRole('button', { name, exact: true })
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await button.click()
    await expect(page).toHaveURL((url) => !url.searchParams.has(key))
  }
})

test('explicit off and invalid switch values stay off', async ({ page }) => {
  for (const value of ['off', 'true', 'false', '1', 'ON', 'invalid', '']) {
    await page.goto(`/?${new URLSearchParams(switches.map(({ key }) => [key, value]))}`)
    for (const { name } of switches) {
      await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute(
        'aria-pressed',
        'false',
      )
    }
  }
})

test('invalid and out-of-range knob values use defaults', async ({ page }) => {
  for (const value of [
    'invalid',
    '42junk',
    '1,5',
    '1e',
    'Infinity',
    '-Infinity',
    '99999',
    '-99999',
    '',
  ]) {
    await page.goto(`/?${new URLSearchParams(knobs.map(({ key }) => [key, value]))}`)
    for (const { name, initial } of knobs) {
      await expect(page.getByRole('slider', { name, exact: true })).toHaveAttribute(
        'aria-valuenow',
        initial,
      )
    }
  }
})

test('browser navigation restores query state', async ({ page }) => {
  await page.goto('/?ingain=36&48v=on')
  await page.evaluate(() => {
    window.history.pushState(null, '', '/?ingain=42&48v=off&bypass=on')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  const gain = page.getByRole('slider', { name: 'Mic gain', exact: true })
  const phantom = page.getByRole('button', { name: '48V phantom power' })
  await expect(gain).toHaveAttribute('aria-valuenow', '42')
  await expect(phantom).toHaveAttribute('aria-pressed', 'false')
  await page.goBack()
  await expect(gain).toHaveAttribute('aria-valuenow', '36')
  await expect(phantom).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.rack')).toHaveAttribute('data-bypassed', 'false')
  await page.goForward()
  await expect(gain).toHaveAttribute('aria-valuenow', '42')
  await expect(phantom).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('.rack')).toHaveAttribute('data-bypassed', 'true')
})
