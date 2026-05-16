const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const { describe, it } = require('node:test');
const { OUTPUT_PATH } = require('../dist/cli');

describe('cli', () => {
  it('rejects empty stdin', () => {
    const result = spawnSync(process.execPath, ['dist/cli.js'], {
      input: '',
      encoding: 'utf8',
      env: { ...process.env, DIFFER_NO_OPEN: '1' },
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /expected unified diff text on stdin/);
  });

  it('writes review HTML from stdin without opening browser when disabled', () => {
    const fixture = readFileSync('test/fixtures/representative.diff', 'utf8');
    const result = spawnSync(process.execPath, ['dist/cli.js'], {
      input: fixture,
      encoding: 'utf8',
      env: { ...process.env, DIFFER_NO_OPEN: '1' },
    });

    assert.equal(result.status, 0);
    assert.equal(existsSync(OUTPUT_PATH), true);
    assert.match(readFileSync(OUTPUT_PATH, 'utf8'), /Local diff review/);
  });
});
