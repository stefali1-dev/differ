export const styles = `
:root {
  color-scheme: dark;
  --bg: #0f150e;
  --bg-header: #010409;
  --panel: #0d1117;
  --panel-subtle: #161b22;
  --border: #30363d;
  --text: #e6edf3;
  --muted: #8b949e;
  --green: #6fdd78;
  --green-bg: rgba(46, 160, 67, 0.16);
  --red: #ffb4ab;
  --red-bg: rgba(248, 81, 73, 0.16);
  --toolbar-height: 56px;
  --radius: 8px;
  --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  --ui: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* { box-sizing: border-box; }
html { background: var(--bg); }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--ui);
}
button, input { font: inherit; }
.toolbar {
  position: sticky;
  top: 0;
  z-index: 30;
  height: var(--toolbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 24px;
  background: var(--bg-header);
  border-bottom: 1px solid var(--border);
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
}
.brand-mark { color: var(--green); }
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.toolbar button {
  border: 1px solid transparent;
  border-radius: 5px;
  color: var(--muted);
  background: transparent;
  padding: 7px 10px;
  cursor: pointer;
}
.toolbar button:hover {
  color: var(--text);
  background: var(--panel-subtle);
}
.view-toggle {
  display: flex;
  padding: 3px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--panel-subtle);
}
.view-toggle button {
  padding: 5px 12px;
}
.view-toggle button.is-active {
  background: var(--border);
  color: var(--text);
}
main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}
.file-list {
  display: grid;
  gap: 16px;
}
.file-card {
  min-width: 0;
  overflow: clip;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--panel);
}
.file-card.is-viewed {
  opacity: 0.78;
}
.file-card.is-viewed:hover {
  opacity: 1;
}
.file-header {
  position: sticky;
  top: var(--toolbar-height);
  z-index: 20;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 14px;
  border-bottom: 1px solid var(--border);
  background: var(--panel);
  cursor: pointer;
}
.file-header:hover { background: var(--panel-subtle); }
.file-meta {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
.disclosure {
  width: 14px;
  color: var(--muted);
}
.file-card.is-collapsed .disclosure::before { content: "▸"; }
.file-card:not(.is-collapsed) .disclosure::before { content: "▾"; }
.file-icon {
  min-width: 28px;
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 2px 4px;
  color: var(--muted);
  font-size: 11px;
  line-height: 16px;
  text-align: center;
}
.icon-python { color: #7ab7ff; }
.icon-yaml { color: #ffb4ab; }
.icon-json { color: #ffd166; }
.icon-markdown { color: #d2a8ff; }
.icon-text { color: var(--text); }
.file-path {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--mono);
  font-size: 13px;
}
.counts {
  display: flex;
  gap: 6px;
  font-family: var(--mono);
  font-size: 12px;
}
.count-add { color: var(--green); }
.count-del { color: var(--red); }
.viewed-control {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--muted);
  font-size: 13px;
  cursor: pointer;
}
.viewed-control input {
  accent-color: var(--green);
}
.file-body { display: block; }
.file-card.is-collapsed .file-body { display: none; }
.unified-view,
.split-view {
  overflow-x: auto;
}
.hunk-header, .empty-summary, .binary-summary {
  padding: 8px 14px;
  color: var(--muted);
  border-bottom: 1px solid var(--border);
  background: var(--panel-subtle);
  font-family: var(--mono);
  font-size: 12px;
}
.diff-table {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
  font-family: var(--mono);
  font-size: 13px;
  line-height: 20px;
}
.diff-table tr:hover td { background-color: rgba(255,255,255,0.025); }
.line-number {
  width: 54px;
  padding: 0 8px;
  color: var(--muted);
  border-right: 1px solid var(--border);
  text-align: right;
  user-select: none;
}
.code-cell {
  padding: 0 12px;
  white-space: pre;
}
.line-insert td { background: var(--green-bg); }
.line-delete td { background: var(--red-bg); }
.line-insert .code-cell { color: #9be9a8; }
.line-delete .code-cell { color: #ffc1ba; }
.split-insert { background: var(--green-bg); }
.split-delete { background: var(--red-bg); }
.split-insert.code-cell { color: #9be9a8; }
.split-delete.code-cell { color: #ffc1ba; }
.split-table .code-cell {
  width: calc(50% - 54px);
}
.split-divider {
  border-left: 1px solid var(--border);
}
.view-unified .split-view { display: none; }
.view-split .unified-view { display: none; }
.blank-cell { background: rgba(255,255,255,0.02); }

@media (max-width: 700px) {
  .toolbar {
    height: auto;
    min-height: var(--toolbar-height);
    align-items: flex-start;
    flex-direction: column;
    padding: 14px;
  }
  .file-header {
    top: 104px;
  }
  main { padding: 14px; }
  .toolbar-actions { flex-wrap: wrap; }
}
`;
