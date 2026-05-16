#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';
import { parseDiff } from './parser';
import { renderPage } from './renderer';

export const OUTPUT_PATH = join(tmpdir(), 'differ', 'review.html');

export function buildReviewPage(diffText: string): string {
  return renderPage(parseDiff(diffText));
}

export function writeReviewPage(diffText: string, outputPath = OUTPUT_PATH): string {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, buildReviewPage(diffText), 'utf8');
  return outputPath;
}

export function main(): void {
  const diffText = readFileSync(0, 'utf8');
  if (diffText.trim().length === 0) {
    console.error('differ: expected unified diff text on stdin');
    process.exitCode = 1;
    return;
  }

  const outputPath = writeReviewPage(diffText);
  if (process.env.DIFFER_NO_OPEN !== '1') {
    openInBrowser(outputPath);
  }
}

function openInBrowser(filePath: string): void {
  const command = process.platform === 'darwin'
    ? 'open'
    : process.platform === 'win32'
      ? 'cmd'
      : 'xdg-open';
  const args = process.platform === 'win32'
    ? ['/c', 'start', '', filePath]
    : [filePath];

  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

if (require.main === module) {
  main();
}
