// Part of `pnpm db:reset`: uploads the demo files of supabase/seed.sql to the private lead-files
// bucket of the local stack, so the Files tab of the seeded leads downloads something.
import { execSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { seedTables } from '../src/lib/db/fake/seed';

const status = JSON.parse(execSync('pnpm exec supabase status -o json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }));
const supabase = createClient(status.API_URL, status.SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const files = seedTables().files;
for (const f of files) {
  const { error } = await supabase.storage
    .from('lead-files')
    .upload(f.path, new Blob([f.bytes as BlobPart], { type: f.contentType }), { contentType: f.contentType, upsert: true });
  if (error) throw new Error(`${f.path}: ${error.message}`);
}
console.log(`Uploaded ${files.length} demo files to lead-files`);
