// pnpm db:seed — writes supabase/seed.sql from the demo data in src/lib/db/fake/seed.ts.
import { writeFileSync } from 'node:fs';
import { renderSeedSql } from '../src/lib/db/fake/seed-sql';

writeFileSync(new URL('../supabase/seed.sql', import.meta.url), renderSeedSql());
console.log('Wrote supabase/seed.sql');
