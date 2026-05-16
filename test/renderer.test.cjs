const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { describe, it } = require('node:test');
const { parseDiff, renderPage } = require('../dist');

const fixture = readFileSync('test/fixtures/representative.diff', 'utf8');
const html = renderPage(parseDiff(fixture));

describe('renderPage', () => {
  it('renders unified and split views with selectable leading markers', () => {
    assert.match(html, /class="unified-view"/);
    assert.match(html, /class="split-view"/);
    assert.match(html, /<td class="code-cell">-        if not token:<\/td>/);
    assert.match(html, /<td class="code-cell">\+        if not token or not token\.startswith\(&quot;Bearer &quot;\):<\/td>/);
  });

  it('renders common file icons and generic fallback', () => {
    assert.match(html, /icon-python[^>]*>Py</);
    assert.match(html, /icon-yaml[^>]*>Yml</);
    assert.match(html, /icon-markdown[^>]*>Md</);
    assert.match(html, /icon-text[^>]*>Txt</);
    assert.match(html, /icon-json[^>]*>\{\}</);
    assert.match(html, /icon-generic[^>]*>•</);
  });

  it('renders binary and empty text diff summaries without fabricating rows', () => {
    assert.match(html, /Binary files differ/);
    assert.match(html, /No text lines in diff\./);
  });

  it('pads unmatched split rows', () => {
    assert.match(html, /blank-cell/);
  });

  it('uses old numbers on left and new numbers on right in split context rows', () => {
    assert.match(
      html,
      /<td class="line-number">46<\/td><td class="code-cell">         return token<\/td>\s*<td class="line-number split-divider">47<\/td>/,
    );
  });

  it('keeps horizontal scrolling at view level instead of per line', () => {
    assert.match(html, /\.unified-view,\s*\.split-view \{\s*overflow-x: auto;/);
    assert.match(html, /\.diff-table \{\s*width: max-content;\s*min-width: 100%;/);
    assert.doesNotMatch(html, /\.code-cell \{[^}]*overflow-x: auto;/s);
  });
});
