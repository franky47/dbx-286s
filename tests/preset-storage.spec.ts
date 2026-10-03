import { expect, test } from '@playwright/test'

for (const query of ['', '?ingain=60&48v=off', '?ingain=invalid&48v=invalid']) {
  test(`saved defaults load on the first render with URL ${query || '(empty)'}`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'dbx-defaults',
        JSON.stringify({
          gain: 0,
          phantom: true,
          drive: 'invalid',
          frequency: 99999,
          output: null,
        }),
      )
      const observer = new MutationObserver(() => {
        const gain = document.querySelector('[role="slider"]')
        if (!gain) return
        document.documentElement.dataset.firstGain = gain.getAttribute('aria-valuenow')!
        observer.disconnect()
      })
      observer.observe(document, { childList: true, subtree: true })
    })
    await page.goto(`/${query}`)
    const explicit = query.includes('60')
    await expect(page.locator('html')).toHaveAttribute('data-first-gain', explicit ? '60' : '0')
    await expect(page.getByRole('button', { name: '48V phantom power' })).toHaveAttribute(
      'aria-pressed',
      explicit ? 'false' : 'true',
    )
    await expect(page.getByRole('slider', { name: 'Drive', exact: true })).toHaveAttribute(
      'aria-valuenow',
      '3.5',
    )
    await expect(page.getByRole('slider', { name: 'Frequency', exact: true })).toHaveAttribute(
      'aria-valuenow',
      '7200',
    )
    await expect(page.getByRole('slider', { name: 'Output gain', exact: true })).toHaveAttribute(
      'aria-valuenow',
      '2',
    )
  })
}

for (const stored of ['not json', 'null', '[]', '42']) {
  test(`invalid saved defaults ${stored} use app defaults`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('dbx-defaults', value), stored)
    await page.goto('/')
    await expect(page.getByRole('slider', { name: 'Mic gain', exact: true })).toHaveAttribute(
      'aria-valuenow',
      '57',
    )
    await expect(page.getByRole('button', { name: 'Save as default' })).toBeDisabled()
  })
}

test('a failed save keeps previous defaults and shows an error below the header buttons', async ({
  page,
}) => {
  await page.goto('/?ingain=36')
  const gain = page.getByRole('slider', { name: 'Mic gain', exact: true })
  const save = page.getByRole('button', { name: 'Save as default' })
  const reset = page.getByRole('button', { name: 'Reset', exact: true })
  await save.click()
  await gain.press('End')
  await expect(page).toHaveURL(/\?ingain=60$/)
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Storage full', 'QuotaExceededError')
    }
  })
  const before = page.url()
  await save.click()
  const error = page.getByRole('alert')
  await expect(error).toHaveText('Could not save defaults in this browser')
  const errorBox = (await error.boundingBox())!
  const saveBox = (await save.boundingBox())!
  expect(errorBox.y).toBeGreaterThanOrEqual(saveBox.y + saveBox.height)
  expect(page.url()).toBe(before)
  await expect(save).toBeEnabled()
  await expect(reset).toBeEnabled()
  await reset.click()
  await expect(gain).toHaveAttribute('aria-valuenow', '36')
  await expect(error).toBeHidden()
  await page.reload()
  await expect(gain).toHaveAttribute('aria-valuenow', '36')
})

test('blocked storage uses app defaults and still allows reset', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Storage blocked', 'SecurityError')
      },
    })
  })
  await page.goto('/')
  const gain = page.getByRole('slider', { name: 'Mic gain', exact: true })
  await expect(gain).toHaveAttribute('aria-valuenow', '57')
  await gain.press('Home')
  await page.getByRole('button', { name: 'Save as default' }).click()
  await expect(page.getByRole('alert')).toHaveText('Could not save defaults in this browser')
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(gain).toHaveAttribute('aria-valuenow', '57')
})
