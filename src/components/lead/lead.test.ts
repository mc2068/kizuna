import { describe, expect, it } from 'vitest';
import { fileProblem, MAX_FILE_BYTES } from './file-rules';
import { extension, formatBytes, formatDateTime, initials } from './format';
import { parseTab } from './tabs';

describe('fileProblem', () => {
  const file = (name: string, size = 1000, type = '') => ({ name, size, type });

  it('accepts PDF, images, Word and Excel', () => {
    for (const name of ['quote.pdf', 'plant.JPG', 'site.png', 'study.docx', 'bills.xlsx']) expect(fileProblem(file(name)), name).toBeNull();
    expect(fileProblem(file('quote.pdf', 10, 'application/pdf'))).toBeNull();
    expect(fileProblem(file('quote.pdf', 10, 'application/octet-stream'))).toBeNull();
  });

  it('refuses other types, a mismatched content type, empty and oversized files', () => {
    expect(fileProblem(file('photos.zip'))).toBe('badType');
    expect(fileProblem(file('script.exe'))).toBe('badType');
    expect(fileProblem(file('noext'))).toBe('badType');
    expect(fileProblem(file('fake.pdf', 10, 'text/html'))).toBe('badType');
    expect(fileProblem(file('empty.pdf', 0))).toBe('empty');
    expect(fileProblem(file('big.pdf', MAX_FILE_BYTES + 1))).toBe('tooBig');
    expect(fileProblem(file('limit.pdf', MAX_FILE_BYTES))).toBeNull();
  });
});

describe('format helpers', () => {
  it('formats sizes, initials, extensions and Tunis time', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(212_000)).toBe('212 KB');
    expect(formatBytes(3_900_000)).toBe('3.9 MB');
    expect(initials('Mohamed Chakroun')).toBe('MC');
    expect(initials('Hamza')).toBe('H');
    expect(extension('Quote Q-0043.PDF')).toBe('pdf');
    expect(extension('.env')).toBe('');
    // 10:30 UTC is 11:30 in Tunis (UTC+1, no daylight saving).
    expect(formatDateTime('2026-11-17T10:30:00.000Z')).toContain('11:30');
  });
});

describe('parseTab', () => {
  it('falls back to overview', () => {
    expect(parseTab('notes')).toBe('notes');
    expect(parseTab(['files', 'notes'])).toBe('files');
    expect(parseTab('settings')).toBe('overview');
    expect(parseTab(undefined)).toBe('overview');
  });
});
