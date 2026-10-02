import { chromium } from '@playwright/test'
import { createServer } from 'vite'

const server = await createServer({ server: { host: '127.0.0.1', port: 0, open: false } })
let browser

try {
  await server.listen()
  browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  })
  await page.goto(server.resolvedUrls.local[0])
  await page.locator('html.dark').waitFor()
  await page.getByRole('slider').first().waitFor()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({
    path: 'public/og-image.png',
    animations: 'disabled',
    style: '[aria-label="Choose theme"] { visibility: hidden; }',
  })
} finally {
  await browser?.close()
  await server.close()
}
