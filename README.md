# differ

Local browser UI for reviewing unified Git diffs.

```bash
git diff | differ
differ < file.diff
```

## Development

```bash
npm install
npm run build
npm link
npm test
```

`differ` reads from `stdin`, generates one offline HTML page, and opens it in your browser. It supports unified/split views, collapsible file diffs, viewed-state persistence, renames, binary summaries, and copyable diff markers.

## Notes

- Requires Node.js.
- Browser state uses `localStorage` on the generated local page.
