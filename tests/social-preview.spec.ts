import { expect, test } from '@playwright/test'

test.use({ javaScriptEnabled: false })

test('social preview metadata and image work without JavaScript', async ({ page, request }) => {
  await page.goto('/')
  const imageUrl = 'https://dbx-286s.francoisbest.com/og-image.png'
  const metadata = {
    'og:type': 'website',
    'og:title': 'DBX 286s',
    'og:image': imageUrl,
    'og:image:type': 'image/png',
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:image:alt': 'DBX 286s front panel in dark mode',
  }
  for (const [property, content] of Object.entries(metadata)) {
    await expect(page.locator(`meta[property="${property}"]`)).toHaveAttribute('content', content)
  }
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  )
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', imageUrl)

  const response = await request.get(new URL(imageUrl).pathname)
  expect(response.ok()).toBe(true)
  expect(response.headers()['content-type']).toContain('image/png')
  const image = await response.body()
  expect(image.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  expect(image.readUInt32BE(16)).toBe(1200)
  expect(image.readUInt32BE(20)).toBe(630)
})
