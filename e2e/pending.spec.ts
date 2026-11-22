// The key flows whose pages are not on the default branch yet. Each is a test.fixme (reported as
// skipped) with the steps it will check; the owner of the blocking issue turns it into a real test
// when the page merges, using the helpers in e2e/support. See e2e/README.md.
import { test } from '@playwright/test';

test.describe('tool (#9, #10)', () => {
  // /tool defaults show the verdict "possible fit"; change city to Tozeur and rooms to 100, the
  // verdict and numbers update with no submit; reload restores the same inputs and result from the URL.
  test.fixme('run the tool and see a verdict', async () => {});
});

test.describe('PDF report (#23)', () => {
  // The share page and its links are covered by projects.spec.ts (#22). Once the report routes
  // merge: "Download PDF" on /projects and on the share page (signed out) answer application/pdf.
  test.fixme('download the PDF from My projects and from the share link', async () => {});
});

test.describe('study request and admin pipeline (#20, #24, #25)', () => {
  // From /tool's CTA, /request-study is prefilled; submit with consent and see the success state.
  // Then as an admin (signInAs SEEDED.admin) the lead is in /admin with status "new".
  test.fixme('request a study and see it in the admin pipeline', async () => {});

  // On /admin/leads/[id]: change the status to "contacted" and see it in History; upload a small
  // PDF in Files and see it listed and downloadable.
  test.fixme('change a lead status and upload a file as an admin', async () => {});
});
