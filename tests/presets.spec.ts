import { expect, test, type Page } from '@playwright/test'

async function mockClipboard(page: Page, fail = false) {
  await page.addInitScript((fail) => {
    let text = ''
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          if (fail) throw new Error('Clipboard blocked')
          text = value
        },
        readText: async () => text,
      },
    })
  }, fail)
}

const fullDefaultQuery = {
  ingain: '57',
  '48v': 'off',
  hp: 'off',
  bypass: 'off',
  drive: '3.5',
  density: '5.25',
  deessfreq: '7.2k',
  deessthresh: '2.5',
  lfdetail: '3',
  hfdetail: '2.25',
  gatethresh: '-45',
  gateratio: '1.3',
  outgain: '2',
}

test('copies all values with replace history and no button layout shift', async ({ page }) => {
  await mockClipboard(page)
  await page.goto('/?keep=value#panel')
  const copy = page.getByRole('button', { name: 'Copy permalink', exact: true })
  const width = (await copy.boundingBox())!.width
  const historyLength = await page.evaluate(() => history.length)
  await copy.click()
  const copied = page.getByRole('button', { name: 'Copied', exact: true })
  await expect(copied).toBeVisible()
  expect((await copied.boundingBox())!.width).toBe(width)
  const link = await page.evaluate(() => navigator.clipboard.readText())
  const url = new URL(link)
  expect(Object.fromEntries(url.searchParams)).toEqual({ keep: 'value', ...fullDefaultQuery })
  expect(url.hash).toBe('#panel')
  await expect(page).toHaveURL(link)
  expect(await page.evaluate(() => history.length)).toBe(historyLength)
  await expect(copy).toBeVisible({ timeout: 4000 })

  await page.getByRole('slider', { name: 'Mic gain', exact: true }).press('Home')
  await page.getByRole('button', { name: '48V phantom power' }).click()
  await page.getByRole('button', { name: 'Save as default' }).click()
  await page.goto(link)
  await expect(page.getByRole('slider', { name: 'Mic gain', exact: true })).toHaveAttribute(
    'aria-valuenow',
    '57',
  )
  await expect(page.getByRole('button', { name: '48V phantom power' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
})

test('copies the current control state before a queued URL update finishes', async ({ page }) => {
  await mockClipboard(page)
  await page.goto('/?ingain=36')
  await page.clock.install()
  const gain = page.getByRole('slider', { name: 'Mic gain', exact: true })
  await gain.press('Home')
  await expect(gain).toHaveAttribute('aria-valuenow', '0')
  await page.getByRole('button', { name: 'Copy permalink' }).click({ force: true })
  const link = await page.evaluate(() => navigator.clipboard.readText())
  expect(Object.fromEntries(new URL(link).searchParams)).toEqual({
    ...fullDefaultQuery,
    ingain: '0',
  })
  await page.clock.runFor(500)
  await expect(page).toHaveURL(link)
})

test('copies successfully even when the address bar update fails', async ({ page }) => {
  await mockClipboard(page)
  await page.goto('/?ingain=36')
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.evaluate(() => {
    history.replaceState = () => {
      throw new Error('History blocked')
    }
  })
  await page.getByRole('button', { name: 'Copy permalink' }).click()
  await expect(page.getByRole('button', { name: 'Copied', exact: true })).toBeVisible()
  const link = await page.evaluate(() => navigator.clipboard.readText())
  expect(Object.fromEntries(new URL(link).searchParams)).toEqual({
    ...fullDefaultQuery,
    ingain: '36',
  })
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page.getByRole('alert')).toBeHidden()
  await expect(page).toHaveURL(/\?ingain=36$/)
  expect(errors).toEqual([])
})

for (const urlFails of [false, true]) {
  test(`clipboard failure opens a selected readonly link, URL failure ${urlFails}`, async ({
    page,
  }) => {
    await mockClipboard(page, true)
    await page.goto('/?ingain=36&keep=value#panel')
    if (urlFails) {
      await page.evaluate(() => {
        history.replaceState = () => {
          throw new Error('History blocked')
        }
      })
    }
    await page.getByRole('button', { name: 'Copy permalink' }).click()
    const input = page.getByRole('textbox', { name: 'Preset permalink' })
    await expect(input).toBeVisible()
    await expect(input).toHaveAttribute('readonly', '')
    await expect(input).toBeFocused()
    const link = await input.inputValue()
    expect(Object.fromEntries(new URL(link).searchParams)).toEqual({
      keep: 'value',
      ...fullDefaultQuery,
      ingain: '36',
    })
    expect(new URL(link).hash).toBe('#panel')
    expect(
      await input.evaluate((node: HTMLInputElement) => [node.selectionStart, node.selectionEnd]),
    ).toEqual([0, link.length])
    if (!urlFails) await expect(page).toHaveURL(link)
    await input.press('Escape')
    await expect(input).toBeHidden()
    await expect(page.getByRole('button', { name: 'Copy permalink' })).toBeFocused()
  })
}

test('Reset keeps a queued knob edit in browser history', async ({ page }) => {
  await page.goto('/?ingain=36')
  await page.clock.install()
  await page.evaluate(() => {
    document
      .querySelector('[role="slider"]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    const reset = [...document.querySelectorAll('button')].find(
      (button) => button.textContent === 'Reset',
    )!
    reset.click()
  })
  await page.clock.runFor(500)
  await expect(page.getByRole('slider', { name: 'Mic gain', exact: true })).toHaveAttribute(
    'aria-valuenow',
    '57',
  )
  await page.goBack()
  await expect(page.getByRole('slider', { name: 'Mic gain', exact: true })).toHaveAttribute(
    'aria-valuenow',
    '0',
  )
})

test('individual knob resets keep an exact saved value between dial positions', async ({
  page,
}) => {
  await page.goto('/?ingain=37')
  const save = page.getByRole('button', { name: 'Save as default' })
  const gain = page.getByRole('slider', { name: 'Mic gain', exact: true })
  await save.click()
  await gain.press('End')
  await gain.dblclick()
  await expect(save).toBeDisabled()
  await expect(page).toHaveURL((url) => !url.searchParams.has('ingain'))
  await gain.press('Home')
  await gain.click({ modifiers: ['Alt'] })
  await expect(save).toBeDisabled()
  await page.goto('/?ingain=37.1')
  await gain.dblclick()
  await expect(save).toBeDisabled()
})

test('saves defaults without changing the URL and resets with browser undo', async ({ page }) => {
  await page.goto('/?keep=value#panel')
  const save = page.getByRole('button', { name: 'Save as default', exact: true })
  const reset = page.getByRole('button', { name: 'Reset', exact: true })
  const gain = page.getByRole('slider', { name: 'Mic gain', exact: true })
  const phantom = page.getByRole('button', { name: '48V phantom power' })
  await expect(save).toBeDisabled()
  await expect(reset).toBeDisabled()
  await gain.press('Home')
  await phantom.click()
  await expect(page).toHaveURL(
    (url) => url.searchParams.get('ingain') === '0' && url.searchParams.get('48v') === 'on',
  )
  const beforeSave = page.url()
  await save.click()
  await expect(save).toBeDisabled()
  await expect(reset).toBeDisabled()
  expect(page.url()).toBe(beforeSave)

  await page.goto('/?keep=value#panel')
  await expect(gain).toHaveAttribute('aria-valuenow', '0')
  await expect(phantom).toHaveAttribute('aria-pressed', 'true')
  await expect(save).toBeDisabled()
  await gain.press('End')
  await phantom.click()
  await expect(page).toHaveURL(
    (url) => url.searchParams.get('ingain') === '60' && url.searchParams.get('48v') === 'off',
  )
  const beforeReset = page.url()
  await reset.click()
  await expect(page).toHaveURL(/\/\?keep=value#panel$/)
  await expect(gain).toHaveAttribute('aria-valuenow', '0')
  await expect(phantom).toHaveAttribute('aria-pressed', 'true')
  await page.goBack()
  await expect(page).toHaveURL(beforeReset)
  await expect(gain).toHaveAttribute('aria-valuenow', '60')
  await expect(phantom).toHaveAttribute('aria-pressed', 'false')
  await gain.dblclick()
  await expect(gain).toHaveAttribute('aria-valuenow', '0')
  await expect(page).toHaveURL((url) => !url.searchParams.has('ingain'))
})
