import { createHash } from 'node:crypto';

export function hashFileState(identity: string, rawDiff: string): string {
  return createHash('sha256').update(identity).update('\0').update(rawDiff).digest('hex');
}
