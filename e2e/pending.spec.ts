// The key flows whose pages are not on the default branch yet: the PDF report (#23, PR 50). Each
// is a test.fixme (reported as skipped) with the steps it will check; turn it into a real test when
// the page merges, using the helpers in e2e/support. See e2e/README.md.
import { test } from '@playwright/test';

test.describe('PDF report (#23)', () => {
  // The share page and its links are covered by projects.spec.ts (#22). Once the report routes
  // merge: "Download PDF" on /projects and on the share page (signed out) answer application/pdf.
  test.fixme('download the PDF from My projects and from the share link', async () => {});
});
