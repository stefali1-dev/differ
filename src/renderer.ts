import { browserScript } from './browser-script';
import { styles } from './styles';
import { DiffFile, DiffHunk, DiffLine } from './types';

interface SplitRow {
  left?: DiffLine;
  right?: DiffLine;
}

export function renderPage(files: DiffFile[]): string {
  const cards = files.map(renderFile).join('');
  return `<!doctype html>
<html lang="en" class="view-unified">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Local diff review</title>
  <style>${styles}</style>
</head>
<body>
  <header class="toolbar">
    <div class="brand"><span class="brand-mark">⌁</span>Local diff review</div>
    <div class="toolbar-actions">
      <button type="button" data-action="collapse-all">Collapse all</button>
      <button type="button" data-action="expand-all">Expand all</button>
      <div class="view-toggle" aria-label="Diff view mode">
        <button type="button" data-view-mode="unified" class="is-active">Unified</button>
        <button type="button" data-view-mode="split">Split</button>
      </div>
    </div>
  </header>
  <main>
    <section class="file-list">${cards}</section>
  </main>
  <script>${browserScript}</script>
</body>
</html>`;
}

function renderFile(file: DiffFile): string {
  const icon = iconFor(file.displayPath);
  const body = file.isBinary
    ? `<div class="binary-summary">${escapeHtml(file.binarySummary ?? 'Binary file')}</div>`
    : file.hunks.length === 0
      ? '<div class="empty-summary">No text lines in diff.</div>'
      : `${renderUnified(file)}${renderSplit(file)}`;

  return `<article class="file-card" data-file-key="${file.key}">
  <header class="file-header">
    <div class="file-meta">
      <span class="disclosure" aria-hidden="true"></span>
      <span class="file-icon ${icon.className}" aria-hidden="true">${icon.label}</span>
      <span class="file-path">${escapeHtml(file.displayPath)}</span>
      <span class="counts">
        <span class="count-add">+${file.addedLines}</span>
        <span class="count-del">-${file.deletedLines}</span>
      </span>
    </div>
    <label class="viewed-control">
      <input class="viewed-checkbox" type="checkbox">
      Viewed
    </label>
  </header>
  <div class="file-body">${body}</div>
</article>`;
}

function renderUnified(file: DiffFile): string {
  return `<div class="unified-view">${file.hunks.map((hunk) => `
    <div class="hunk-header">${escapeHtml(hunk.header)}</div>
    <table class="diff-table">
      <tbody>${hunk.lines.map(renderUnifiedLine).join('')}</tbody>
    </table>`).join('')}</div>`;
}

function renderUnifiedLine(line: DiffLine): string {
  return `<tr class="line-${line.type}">
    <td class="line-number">${line.oldNumber ?? ''}</td>
    <td class="line-number">${line.newNumber ?? ''}</td>
    <td class="code-cell">${escapeHtml(line.content)}</td>
  </tr>`;
}

function renderSplit(file: DiffFile): string {
  return `<div class="split-view">${file.hunks.map((hunk) => `
    <div class="hunk-header">${escapeHtml(hunk.header)}</div>
    <table class="diff-table split-table">
      <tbody>${buildSplitRows(hunk).map(renderSplitRow).join('')}</tbody>
    </table>`).join('')}</div>`;
}

function buildSplitRows(hunk: DiffHunk): SplitRow[] {
  const rows: SplitRow[] = [];
  const lines = hunk.lines;

  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    if (line.type === 'context') {
      rows.push({ left: line, right: line });
      index += 1;
      continue;
    }

    const deletes: DiffLine[] = [];
    while (lines[index]?.type === 'delete') {
      deletes.push(lines[index]);
      index += 1;
    }

    const inserts: DiffLine[] = [];
    while (lines[index]?.type === 'insert') {
      inserts.push(lines[index]);
      index += 1;
    }

    const rowCount = Math.max(deletes.length, inserts.length);
    for (let offset = 0; offset < rowCount; offset += 1) {
      rows.push({ left: deletes[offset], right: inserts[offset] });
    }
  }

  return rows;
}

function renderSplitRow(row: SplitRow): string {
  return `<tr class="line-context">
    ${renderSplitSide(row.left, false)}
    ${renderSplitSide(row.right, true)}
  </tr>`;
}

function renderSplitSide(line: DiffLine | undefined, isRightSide: boolean): string {
  const dividerClass = isRightSide ? ' split-divider' : '';
  if (!line) {
    return `<td class="line-number${dividerClass} blank-cell"></td><td class="code-cell blank-cell"></td>`;
  }
  const splitClass = line.type === 'insert'
    ? ' split-insert'
    : line.type === 'delete'
      ? ' split-delete'
      : '';
  const lineNumber = isRightSide
    ? line.newNumber ?? line.oldNumber ?? ''
    : line.oldNumber ?? line.newNumber ?? '';
  return `<td class="line-number${dividerClass}${splitClass}">${lineNumber}</td><td class="code-cell${splitClass}">${escapeHtml(line.content)}</td>`;
}

function iconFor(path: string): { label: string; className: string } {
  const lower = path.toLowerCase();
  if (lower.endsWith('.py')) return { label: 'Py', className: 'icon-python' };
  if (lower.endsWith('.txt')) return { label: 'Txt', className: 'icon-text' };
  if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return { label: 'Yml', className: 'icon-yaml' };
  if (lower.endsWith('.json')) return { label: '{}', className: 'icon-json' };
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return { label: 'Md', className: 'icon-markdown' };
  return { label: '•', className: 'icon-generic' };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
