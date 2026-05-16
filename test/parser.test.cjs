const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { describe, it } = require('node:test');
const { parseDiff } = require('../dist');

const fixture = readFileSync('test/fixtures/representative.diff', 'utf8');

describe('parseDiff', () => {
  it('parses multiple files, hunks, line counts, renames, binary files, and empty files', () => {
    const files = parseDiff(fixture);

    assert.equal(files.length, 6);
    assert.equal(files[0].displayPath, 'libs/auth/provider.py');
    assert.equal(files[0].hunks.length, 2);
    assert.equal(files[0].addedLines, 5);
    assert.equal(files[0].deletedLines, 3);
    assert.deepEqual(
      files[0].hunks[0].lines.map((line) => line.type),
      ['context', 'delete', 'delete', 'insert', 'insert', 'insert', 'context'],
    );

    assert.equal(files[2].isRename, true);
    assert.equal(files[2].displayPath, 'docs/old-name.md → docs/new-name.md');
    assert.equal(files[3].isBinary, true);
    assert.equal(files[3].binarySummary, 'Binary files differ');
    assert.equal(files[4].isNew, true);
    assert.equal(files[4].hunks.length, 0);
    assert.equal(files[5].isDeleted, true);
    assert.equal(files[5].hunks.length, 0);
  });

  it('normalizes CRLF input', () => {
    const files = parseDiff(fixture.replace(/\n/g, '\r\n'));
    assert.equal(files[0].hunks[0].lines[0].content, '     def authenticate(self, request):');
  });

  it('changes file state key when diff content changes', () => {
    const original = parseDiff(fixture)[0];
    const changed = parseDiff(fixture.replace('Invalid token', 'Missing token'))[0];
    assert.notEqual(original.key, changed.key);
  });

  it('keeps repeated raw lines in file hash input', () => {
    const diff = `diff --git a/x.txt b/x.txt
--- a/x.txt
+++ b/x.txt
@@ -1,2 +1,2 @@
 same
 same`;
    const file = parseDiff(diff)[0];
    assert.match(file.rawDiff, / same\n same$/);
  });

  it('keeps --- and +++ body lines as hunk content', () => {
    const diff = `diff --git a/x.txt b/x.txt
--- a/x.txt
+++ b/x.txt
@@ -1 +1 @@
---- old marker-like content
++++ new marker-like content`;
    const lines = parseDiff(diff)[0].hunks[0].lines;
    assert.deepEqual(lines.map((line) => line.content), ['---- old marker-like content', '++++ new marker-like content']);
  });
});
