// What the Files tab accepts. Checked in the browser (instant feedback) and again on the server
// in the upload route (the browser check is only a convenience).
import { extension } from './format';

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Extensions and the content types browsers send for them. */
const ACCEPTED: Record<string, string[]> = {
  pdf: ['application/pdf'],
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  webp: ['image/webp'],
  heic: ['image/heic', 'image/heif'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
};

/** For the file picker's `accept` attribute. */
export const ACCEPT_ATTRIBUTE = Object.keys(ACCEPTED)
  .map((e) => `.${e}`)
  .join(',');

export type FileProblem = 'tooBig' | 'badType' | 'empty';

/**
 * Why a file cannot be uploaded, or null when it is fine. The extension decides the type; a
 * content type, when the browser sends one, must match it (some send '' or octet-stream).
 */
export function fileProblem(file: { name: string; size: number; type: string }): FileProblem | null {
  if (file.size === 0) return 'empty';
  if (file.size > MAX_FILE_BYTES) return 'tooBig';
  const types = ACCEPTED[extension(file.name)];
  if (!types) return 'badType';
  if (file.type && file.type !== 'application/octet-stream' && !types.includes(file.type)) return 'badType';
  return null;
}
