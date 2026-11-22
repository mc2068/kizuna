// Row-level security, straight against the database API with each kind of visitor:
// user A vs user B vs an admin vs anonymous. Run with `pnpm test:db` (needs local Supabase).
import { beforeAll, describe, expect, it } from 'vitest';
import { DEMO_SHARE_TOKEN, DEMO_USERS } from '@/lib/db/fake/seed';
import type { Supabase } from '@/lib/supabase/server';
import { anonClient, clientFor, resetData, runSupabaseTests, serviceClient } from './supabase/local';

const project = { hotel_name: 'Hotel A', inputs: { rooms: 300 }, results: { engineKwe: 200 }, engine_version: 'test' };

const lead = {
  hotel_name: 'Forged lead',
  city: 'djerba',
  rooms: 300,
  contact_name: 'Someone',
  email: 'someone@hotel.example',
  consent: true,
  inputs: {},
  results: {},
  engine_version: 'test',
};

describe.runIf(runSupabaseTests)('row-level security', () => {
  let anon: Supabase, userA: Supabase, userB: Supabase, admin: Supabase;
  let projectA: { id: string; share_token: string };
  const filePath = 'L-1047/rls-test.pdf';

  beforeAll(async () => {
    await resetData();
    anon = anonClient();
    [userA, userB, admin] = await Promise.all([clientFor('userA'), clientFor('userB'), clientFor('mohamed')]);
    // Projects are inserted by the server (service role), like saveProject does.
    const { data, error } = await serviceClient()
      .from('projects')
      .insert({ ...project, owner_id: DEMO_USERS.userA.id })
      .select('id, share_token')
      .single();
    if (error) throw error;
    projectA = data;
    const upload = await admin.storage.from('lead-files').upload(filePath, new Blob(['%PDF-1.4 rls']), { contentType: 'application/pdf' });
    if (upload.error) throw upload.error;
  });

  describe('projects', () => {
    it('the owner reads their project; user B, admins and anonymous see nothing', async () => {
      expect((await userA.from('projects').select('id').eq('id', projectA.id)).data).toHaveLength(1);
      for (const other of [userB, admin, anon]) {
        expect((await other.from('projects').select('id').eq('id', projectA.id)).data).toEqual([]);
      }
    });

    it('user B cannot update or delete it', async () => {
      const upd = await userB.from('projects').update({ hotel_name: 'Hijacked' }).eq('id', projectA.id).select('id');
      expect(upd.data).toEqual([]);
      const del = await userB.from('projects').delete().eq('id', projectA.id).select('id');
      expect(del.data).toEqual([]);
      const still = await userA.from('projects').select('hotel_name').eq('id', projectA.id).single();
      expect(still.data?.hotel_name).not.toBe('Hijacked');
    });

    it('nobody inserts a project directly: results are computed on the server', async () => {
      expect((await userA.from('projects').insert({ ...project, owner_id: DEMO_USERS.userA.id })).error).not.toBeNull();
      expect((await userB.from('projects').insert({ ...project, owner_id: DEMO_USERS.userA.id })).error).not.toBeNull();
      expect((await anon.from('projects').insert(project)).error).not.toBeNull();
    });

    it('the owner may rename their project but not change its results or share token', async () => {
      const rename = await userA.from('projects').update({ hotel_name: 'Hotel A, renamed' }).eq('id', projectA.id).select('hotel_name');
      expect(rename.data).toEqual([{ hotel_name: 'Hotel A, renamed' }]);
      expect((await userA.from('projects').update({ results: { engineKwe: 9999 } }).eq('id', projectA.id)).error).not.toBeNull();
      expect((await userA.from('projects').update({ share_token: 'mine' }).eq('id', projectA.id)).error).not.toBeNull();
    });

    it('the share link RPC returns only the five public fields, to anyone', async () => {
      const { data, error } = await anon.rpc('get_shared_project', { token: projectA.share_token });
      expect(error).toBeNull();
      expect(Object.keys(data![0]).sort()).toEqual(['created_at', 'engine_version', 'hotel_name', 'inputs', 'results']);
      expect((await anon.rpc('get_shared_project', { token: DEMO_SHARE_TOKEN })).data).toHaveLength(1);
      expect((await anon.rpc('get_shared_project', { token: 'nope' })).data).toEqual([]);
    });
  });

  describe('leads, notes, events and files', () => {
    const tables = ['leads', 'lead_notes', 'lead_events', 'lead_files'] as const;

    it('admins read them all', async () => {
      for (const t of tables) {
        const { data, error } = await admin.from(t).select('*');
        expect(error).toBeNull();
        expect(data!.length, t).toBeGreaterThan(0);
      }
    });

    it('users and anonymous read none of them', async () => {
      for (const client of [userA, userB, anon]) {
        for (const t of tables) expect((await client.from(t).select('*')).data, t).toEqual([]);
      }
    });

    it('nobody inserts a lead directly, not even an admin (the server uses the service role)', async () => {
      for (const client of [anon, userA, admin]) expect((await client.from('leads').insert(lead)).error).not.toBeNull();
    });

    it('users cannot change a lead or add a note', async () => {
      const upd = await userA.from('leads').update({ status: 'won' }).eq('id', 'L-1047').select('id');
      expect(upd.data).toEqual([]);
      expect((await userA.from('lead_notes').insert({ lead_id: 'L-1047', body: 'hi' })).error).not.toBeNull();
    });

    it('an admin cannot write a note in another admin’s name', async () => {
      const forged = await admin.from('lead_notes').insert({ lead_id: 'L-1047', body: 'hi', author_id: DEMO_USERS.hamza.id });
      expect(forged.error).not.toBeNull();
    });

    it('an admin changes only the status and owner, never the request itself', async () => {
      for (const patch of [{ results: {} }, { email: 'x@y.example' }, { consent: true }]) {
        expect((await admin.from('leads').update(patch).eq('id', 'L-1047')).error, Object.keys(patch)[0]).not.toBeNull();
      }
    });

    it('an admin uploads only under an existing lead', async () => {
      const r = await admin.storage.from('lead-files').upload('L-9999/orphan.pdf', new Blob(['x']));
      expect(r.error).not.toBeNull();
    });

    it('a lead can only be owned by an admin', async () => {
      const r = await admin.from('leads').update({ owner_id: DEMO_USERS.userA.id }).eq('id', 'L-1047');
      expect(r.error?.message).toMatch(/owned by an admin/);
    });

    it('status and owner changes are logged with the actor', async () => {
      await admin.from('leads').update({ status: 'quoted', owner_id: DEMO_USERS.hamza.id }).eq('id', 'L-1052');
      const { data } = await admin.from('lead_events').select('kind, data, actor_id').eq('lead_id', 'L-1052').in('kind', ['status', 'owner']);
      expect(data).toEqual(
        expect.arrayContaining([
          { kind: 'status', data: { from: 'new', to: 'quoted' }, actor_id: DEMO_USERS.mohamed.id },
          { kind: 'owner', data: { from: DEMO_USERS.mohamed.id, to: DEMO_USERS.hamza.id }, actor_id: DEMO_USERS.mohamed.id },
        ]),
      );
    });
  });

  describe('profiles and roles', () => {
    it('a user reads only their own profile; an admin reads all', async () => {
      expect((await userA.from('profiles').select('id')).data).toEqual([{ id: DEMO_USERS.userA.id }]);
      expect((await anon.from('profiles').select('id')).data).toEqual([]);
      expect((await admin.from('profiles').select('id')).data!.length).toBeGreaterThanOrEqual(6);
    });

    it('a user cannot make themselves an admin', async () => {
      const r = await userA.from('profiles').update({ role: 'admin' }).eq('id', DEMO_USERS.userA.id).select('id');
      expect(r.data ?? []).toEqual([]);
      expect((await userA.rpc('is_admin')).data).toBe(false);
      expect((await admin.rpc('is_admin')).data).toBe(true);
    });

    it('the internal helpers are not callable from the API', async () => {
      expect((await userA.rpc('next_lead_owner' as never)).error).not.toBeNull();
    });
  });

  describe('lead-files bucket', () => {
    it('an admin downloads a file', async () => {
      const { data, error } = await admin.storage.from('lead-files').download(filePath);
      expect(error).toBeNull();
      expect(await data!.text()).toBe('%PDF-1.4 rls');
    });

    it('a non-admin cannot read, list, sign, upload or delete', async () => {
      for (const client of [userA, anon]) {
        const bucket = client.storage.from('lead-files');
        expect((await bucket.download(filePath)).error).not.toBeNull();
        expect((await bucket.list('L-1047')).data ?? []).toEqual([]);
        expect((await bucket.createSignedUrl(filePath, 60)).error).not.toBeNull();
        expect((await bucket.upload('L-1047/evil.pdf', new Blob(['x']))).error).not.toBeNull();
        await bucket.remove([filePath]);
      }
      expect((await admin.storage.from('lead-files').download(filePath)).error).toBeNull();
    });

    it('the bucket is private', async () => {
      const { data } = anon.storage.from('lead-files').getPublicUrl(filePath);
      expect((await fetch(data.publicUrl)).ok).toBe(false);
    });
  });
});
