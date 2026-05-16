import { hashFileState } from './hash';
import { DiffFile, DiffHunk, DiffLine } from './types';

interface WorkingFile {
  oldPath: string;
  newPath: string;
  addedLines: number;
  deletedLines: number;
  isNew: boolean;
  isDeleted: boolean;
  isRename: boolean;
  isBinary: boolean;
  binarySummary?: string;
  hunks: DiffHunk[];
  rawLines: string[];
}

/**
 * Parser shape intentionally follows only the small diff2html subset this product needs:
 * Git/unified file boundaries, hunk ranges, rename metadata, binary summaries, and line numbers.
 */
export function parseDiff(input: string): DiffFile[] {
  const lines = normalizeInput(input);
  const files: DiffFile[] = [];
  let current: WorkingFile | undefined;
  let currentHunk: DiffHunk | undefined;
  let oldLine = 0;
  let newLine = 0;

  const finishCurrent = (): void => {
    if (!current) return;

    const oldPath = current.oldPath || current.newPath;
    const newPath = current.newPath || current.oldPath;
    if (!oldPath && !newPath) {
      current = undefined;
      currentHunk = undefined;
      return;
    }

    const displayPath = current.isRename && oldPath !== newPath
      ? `${oldPath} → ${newPath}`
      : newPath !== '/dev/null'
        ? newPath
        : oldPath;
    const rawDiff = current.rawLines.join('\n');
    const identity = `${oldPath}\0${newPath}`;

    files.push({
      oldPath,
      newPath,
      displayPath,
      addedLines: current.addedLines,
      deletedLines: current.deletedLines,
      isNew: current.isNew,
      isDeleted: current.isDeleted,
      isRename: current.isRename,
      isBinary: current.isBinary,
      binarySummary: current.binarySummary,
      hunks: current.hunks,
      rawDiff,
      key: hashFileState(identity, rawDiff),
    });

    current = undefined;
    currentHunk = undefined;
  };

  const startFile = (firstLine: string): void => {
    finishCurrent();
    current = {
      oldPath: '',
      newPath: '',
      addedLines: 0,
      deletedLines: 0,
      isNew: false,
      isDeleted: false,
      isRename: false,
      isBinary: false,
      hunks: [],
      rawLines: [firstLine],
    };
    currentHunk = undefined;

    const names = /^diff --git "?(.+?)"? "?(.+?)"?$/.exec(firstLine);
    if (names) {
      current.oldPath = cleanPath(names[1]);
      current.newPath = cleanPath(names[2]);
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const next = lines[index + 1];
    const afterNext = lines[index + 2];

    if (line.startsWith('diff --git ')) {
      startFile(line);
      continue;
    }

    if (
      line.startsWith('--- ') &&
      next?.startsWith('+++ ') &&
      afterNext?.startsWith('@@') &&
      (!current || current.hunks.length > 0)
    ) {
      startFile(line);
      current!.oldPath = cleanHeaderPath(line, '--- ');
      continue;
    }

    if (!current) continue;
    current.rawLines.push(line);

    if (!currentHunk && line.startsWith('--- ')) {
      current.oldPath = cleanHeaderPath(line, '--- ');
      current.isNew = current.oldPath === '/dev/null';
      continue;
    }

    if (!currentHunk && line.startsWith('+++ ')) {
      current.newPath = cleanHeaderPath(line, '+++ ');
      current.isDeleted = current.newPath === '/dev/null';
      continue;
    }

    const renameFrom = /^rename from "?(.+?)"?$/.exec(line);
    if (renameFrom) {
      current.oldPath = renameFrom[1];
      current.isRename = true;
      continue;
    }

    const renameTo = /^rename to "?(.+?)"?$/.exec(line);
    if (renameTo) {
      current.newPath = renameTo[1];
      current.isRename = true;
      continue;
    }

    if (/^new file mode \d{6}$/.test(line)) {
      current.isNew = true;
      continue;
    }

    if (/^deleted file mode \d{6}$/.test(line)) {
      current.isDeleted = true;
      continue;
    }

    const binaryMatch = /^Binary files (.+) and (.+) differ$/.exec(line);
    if (binaryMatch) {
      current.isBinary = true;
      current.binarySummary = 'Binary files differ';
      current.oldPath = cleanPath(binaryMatch[1]);
      current.newPath = cleanPath(binaryMatch[2]);
      continue;
    }

    if (line === 'GIT binary patch') {
      current.isBinary = true;
      current.binarySummary = 'Git binary patch';
      continue;
    }

    const hunkMatch = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@.*$/.exec(line);
    if (hunkMatch) {
      oldLine = Number.parseInt(hunkMatch[1], 10);
      newLine = Number.parseInt(hunkMatch[2], 10);
      currentHunk = {
        header: line,
        oldStart: oldLine,
        newStart: newLine,
        lines: [],
      };
      current.hunks.push(currentHunk);
      continue;
    }

    if (!currentHunk || !isDiffBodyLine(line)) continue;

    const diffLine = createLine(line, oldLine, newLine);
    currentHunk.lines.push(diffLine);
    if (diffLine.type === 'insert') {
      current.addedLines += 1;
      newLine += 1;
    } else if (diffLine.type === 'delete') {
      current.deletedLines += 1;
      oldLine += 1;
    } else {
      oldLine += 1;
      newLine += 1;
    }
  }

  finishCurrent();
  return files;
}

function normalizeInput(input: string): string[] {
  return input.replace(/\\ No newline at end of file/g, '').replace(/\r\n?/g, '\n').split('\n');
}

function isDiffBodyLine(line: string): boolean {
  return line.startsWith('+') || line.startsWith('-') || line.startsWith(' ');
}

function createLine(content: string, oldNumber: number, newNumber: number): DiffLine {
  if (content.startsWith('+')) {
    return { type: 'insert', content, newNumber };
  }
  if (content.startsWith('-')) {
    return { type: 'delete', content, oldNumber };
  }
  return { type: 'context', content, oldNumber, newNumber };
}

function cleanHeaderPath(line: string, prefix: '--- ' | '+++ '): string {
  return cleanPath(
    line
      .slice(prefix.length)
      .replace(/\s+\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)? [+-]\d{4}.*$/, ''),
  );
}

function cleanPath(path: string): string {
  const unquoted = path.replace(/^"(.*)"$/, '$1');
  return unquoted.replace(/^[ab]\//, '');
}
