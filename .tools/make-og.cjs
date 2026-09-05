// Renders og.html at 1200x630 (2x, then downsampled) into the site repo.
const path = require('path');
const { chromium } = require('playwright');
const sharp = require('sharp');

const SRC = 'file:///' + path.resolve(__dirname, 'og.html').replace(/\\/g, '/');
const TMP = path.resolve(__dirname, 'og-2x.png');
const OUT = path.resolve(__dirname, '../img/og.png');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
  await page.goto(SRC);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  await page.screenshot({ path: TMP, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await browser.close();

  await sharp(TMP).resize(1200, 630).png({ quality: 90, compressionLevel: 9 }).toFile(OUT);
  const meta = await sharp(OUT).metadata();
  const { size } = require('fs').statSync(OUT);
  console.log(`og.png ${meta.width}x${meta.height}  ${(size / 1024).toFixed(0)} KB`);
})().catch(e => { console.error(e); process.exit(1); });
