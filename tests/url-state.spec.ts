import { expect, test } from '@playwright/test'
import { settingsParsers } from '../src/lib/query-state'
import { graduationTaper } from '../src/lib/graduations'

const frequencyValues = [
  800, 820, 840, 860, 880, 900, 920, 940, 960, 980, 1000, 1300, 1600, 1900, 2200, 2500, 2800, 3100,
  3400, 3700, 4000, 4400, 4800, 5200, 5600, 6000, 6400, 6800, 7200, 7600, 8000, 8200, 8400, 8600,
  8800, 9000, 9200, 9400, 9600, 9800, 10000,
]

test('frequency URLs preserve all 41 positions exactly in Hz and kHz', () => {
  const parser = settingsParsers.frequency
  const taper = graduationTaper('frequency')
  for (const [index, hz] of frequencyValues.entries()) {
    const value = Number(taper.toValue(index / 40).toFixed(6))
    const encoded = `${hz / 1000}k`
    expect(value).toBe(hz)
    expect(parser.serialize(value)).toBe(encoded)
    expect(parser.parse(encoded)).toBe(hz)
    expect(parser.parse(String(hz))).toBe(hz)
    expect(parser.serialize(parser.parse(encoded)!)).toBe(encoded)
  }
  expect(parser.defaultValue).toBe(7200)
})

test('frequency URLs reject malformed and out-of-range kHz values', () => {
  for (const value of [
    'k',
    '0.79k',
    '10.01k',
    '-0.8k',
    'Infinityk',
    'NaNk',
    '6.4kk',
    '6.4kHz',
    '6.4kjunk',
    '6,4k',
    '0x4k',
    '1e0k',
  ]) {
    expect(settingsParsers.frequency.parse(value), value).toBeNull()
  }
  expect(settingsParsers.drive.parse('1k')).toBeNull()
})

for (const value of ['800', '0.8k', '6400', '6.4k', '10000', '10k']) {
  test(`frequency URL ${value} loads in Hz and survives reload`, async ({ page }) => {
    const hz = value.endsWith('k') ? Number(value.slice(0, -1)) * 1000 : Number(value)
    await page.goto(`/?deessfreq=${value}`)
    const dial = page.getByRole('slider', { name: 'Frequency', exact: true })
    await expect(dial).toHaveAttribute('aria-valuenow', String(hz))
    await page.reload()
    await expect(dial).toHaveAttribute('aria-valuenow', String(hz))
  })
}

test('frequency knob writes short kHz URLs at every position', async ({ page }) => {
  await page.goto('/')
  const dial = page.getByRole('slider', { name: 'Frequency', exact: true })
  await dial.press('Home')
  for (const hz of frequencyValues) {
    await expect(dial).toHaveAttribute('aria-valuenow', String(hz))
    await expect(page).toHaveURL((url) =>
      hz === 7200
        ? !url.searchParams.has('deessfreq')
        : url.searchParams.get('deessfreq') === `${hz / 1000}k`,
    )
    await dial.press('ArrowUp')
  }
})

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
    knobs.every(
      ({ key, max }) => url.searchParams.get(key) === (key === 'deessfreq' ? '10k' : max),
    ),
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
