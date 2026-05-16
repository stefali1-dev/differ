const assert = require('node:assert/strict');
const { readFileSync, writeFileSync } = require('node:fs');
const { mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { describe, it } = require('node:test');
const { chromium } = require('playwright');
const { parseDiff, renderPage } = require('../dist');

const fixture = readFileSync('test/fixtures/representative.diff', 'utf8');

function writeHtml(diff = fixture) {
  const dir = mkdtempSync(join(tmpdir(), 'differ-browser-'));
  const file = join(dir, 'review.html');
  writeFileSync(file, renderPage(parseDiff(diff)), 'utf8');
  return `file://${file}`;
}

async function withPage(run, diff = fixture) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(writeHtml(diff));
  try {
    await run(page);
  } finally {
    await browser.close();
  }
}

describe('browser behavior', () => {
  it('switches views and restores selected mode', async () => {
    await withPage(async (page) => {
      await page.getByText('Split', { exact: true }).click();
      assert.equal(await page.locator('.split-view').first().isVisible(), true);
      assert.equal(await page.evaluate(() => document.documentElement.classList.contains('view-split')), true);
      await page.reload();
      assert.equal(await page.evaluate(() => document.documentElement.classList.contains('view-split')), true);
    });
  });

  it('collapses via header and global controls', async () => {
    await withPage(async (page) => {
      const first = page.locator('.file-card').first();
      await first.locator('.file-header').click();
      assert.equal(await first.evaluate((card) => card.classList.contains('is-collapsed')), true);
      await page.getByText('Expand all', { exact: true }).click();
      assert.equal(await first.evaluate((card) => card.classList.contains('is-collapsed')), false);
      await page.getByText('Collapse all', { exact: true }).click();
      assert.equal(await first.evaluate((card) => card.classList.contains('is-collapsed')), true);
    });
  });

  it('handles viewed state without header click bubbling and restores it collapsed', async () => {
    await withPage(async (page) => {
      const first = page.locator('.file-card').first();
      const checkbox = first.locator('.viewed-checkbox');
      await checkbox.check();
      assert.equal(await first.evaluate((card) => card.classList.contains('is-collapsed')), true);
      assert.equal(await first.evaluate((card) => card.classList.contains('is-viewed')), true);

      await first.locator('.file-header').click();
      assert.equal(await first.evaluate((card) => card.classList.contains('is-collapsed')), false);

      await page.reload();
      assert.equal(await first.evaluate((card) => card.classList.contains('is-collapsed')), true);
      assert.equal(await checkbox.isChecked(), true);

      await checkbox.uncheck();
      assert.equal(await first.evaluate((card) => card.classList.contains('is-collapsed')), false);
    });
  });

  it('restores collapsed state for unviewed files', async () => {
    await withPage(async (page) => {
      const second = page.locator('.file-card').nth(1);
      await second.locator('.file-header').click();
      await page.reload();
      assert.equal(await second.evaluate((card) => card.classList.contains('is-collapsed')), true);
    });
  });

  it('does not carry viewed state into changed diff content', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const dir = mkdtempSync(join(tmpdir(), 'differ-browser-'));
    const file = join(dir, 'review.html');
    const write = (diff) => writeFileSync(file, renderPage(parseDiff(diff)), 'utf8');
    write(fixture);
    await page.goto(`file://${file}`);
    await page.locator('.file-card').first().locator('.viewed-checkbox').check();

    write(fixture.replace('Invalid token', 'Missing token'));
    await page.reload();
    assert.equal(await page.locator('.file-card').first().locator('.viewed-checkbox').isChecked(), false);
    await browser.close();
  });

  it('keeps sticky headers while scrolling', async () => {
    const largeBody = Array.from({ length: 120 }, (_, index) => ` line ${index}`).join('\n');
    const largeDiff = `diff --git a/large.txt b/large.txt
--- a/large.txt
+++ b/large.txt
@@ -1,120 +1,120 @@
${largeBody}`;

    await withPage(async (page) => {
      const header = page.locator('.file-header').first();
      await page.evaluate(() => window.scrollTo(0, 700));
      const box = await header.boundingBox();
      assert.ok(box.y >= 50 && box.y <= 60, `expected sticky header near toolbar, got y=${box.y}`);
    }, largeDiff);
  });

  it('keeps leading diff markers in selected text', async () => {
    await withPage(async (page) => {
      const selected = await page.locator('.unified-view .line-delete .code-cell').first().evaluate((cell) => {
        const range = document.createRange();
        range.selectNodeContents(cell);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        return selection.toString();
      });
      assert.equal(selected.startsWith('-'), true);
    });
  });
});
