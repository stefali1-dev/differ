export type DiffLineType = 'context' | 'insert' | 'delete';

export interface DiffLine {
  type: DiffLineType;
  content: string;
  oldNumber?: number;
  newNumber?: number;
}

export interface DiffHunk {
  header: string;
  oldStart: number;
  newStart: number;
  lines: DiffLine[];
}

export interface DiffFile {
  oldPath: string;
  newPath: string;
  displayPath: string;
  addedLines: number;
  deletedLines: number;
  isNew: boolean;
  isDeleted: boolean;
  isRename: boolean;
  isBinary: boolean;
  binarySummary?: string;
  hunks: DiffHunk[];
  rawDiff: string;
  key: string;
}
