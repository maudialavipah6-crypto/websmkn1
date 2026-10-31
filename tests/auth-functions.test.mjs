import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { transformWithEsbuild } from 'vite';

const adminId = '11111111-1111-4111-8111-111111111111';
const targetId = '22222222-2222-4222-8222-222222222222';
async function endpoint(name, profile = { role: 'admin', active: true }) {
  const source = (await readFile(new URL(`../supabase/functions/${name}/index.ts`, import.meta.url), 'utf8')).replace(/^import .*?;\n/, '');
  const { code } = await transformWithEsbuild(source, 'endpoint.ts', { loader: 'ts' });
  let handler;
  const writes = [];
  const chain = { select: () => chain, eq: () => chain, single: async () => ({ data: profile }), maybeSingle: async () => ({ data: profile }), order: async () => ({ data: [] }) };
  const client = {
    from: () => chain,
    auth: {
      getUser: async () => ({ data: { user: { id: adminId } } }),
      signInWithPassword: async () => ({ data: { session: { access_token: 'fixture-access', refresh_token: 'fixture-refresh' } } }),
      admin: {
        getUserById: async () => ({ data: { user: { email: 'fixture@example.test' } } }),
        createUser: async data => { writes.push(data); return { data: { user: { id: targetId } } }; },
        updateUserById: async (id, data) => { writes.push({ id, ...data }); return {}; },
        deleteUser: async id => { writes.push({ id }); return {}; },
      },
    },
  };
  chain.upsert = async data => { writes.push(data); return {}; };
  chain.update = data => ({ eq: async () => { writes.push(data); return {}; } });
  vm.runInNewContext(code, { Request, Response, createClient: () => client, Deno: { env: { get: () => 'fixture' }, serve: value => { handler = value; } } });
  return {
    writes,
    send: (body, { method = 'POST', token = true, raw } = {}) => handler(new Request('https://example.test', {
      method, headers: token ? { Authorization: 'Bearer fixture' } : {},
      ...(['GET', 'OPTIONS'].includes(method) ? {} : { body: raw ?? JSON.stringify(body) }),
    })),
  };
}

test('admin API rejects missing session, wrong method, student, teacher and inactive admin', async () => {
  const api = await endpoint('admin-users');
  assert.equal((await api.send({}, { token: false })).status, 401);
  assert.equal((await api.send({}, { method: 'DELETE' })).status, 405);
  for (const profile of [{ role: 'student', active: true }, { role: 'teacher', active: true }, { role: 'admin', active: false }]) {
    const denied = await endpoint('admin-users', profile);
    assert.equal((await denied.send({ action: 'list' })).status, 403);
    assert.equal(denied.writes.length, 0);
  }
});

test('admin API validates bodies and prevents self deletion/demotion', async () => {
  const api = await endpoint('admin-users');
  for (const body of [null, [], { action: 'delete', id: 'bad-id' }, { action: 'delete', id: adminId }, { action: 'update', id: adminId, role: 'student', active: true }, { action: 'password', id: targetId, password: 12345678 }, { action: 'update', id: targetId, userId: 'SISWA001', displayName: 'Siswa', role: 'student', active: 'false' }]) {
    assert.equal((await api.send(body)).status, 400);
  }
  assert.equal(api.writes.length, 0);
});

test('admin API accepts valid create, update and password requests', async () => {
  const api = await endpoint('admin-users');
  const account = { userId: 'SISWA001', displayName: 'Siswa Uji', role: 'student' };
  assert.equal((await api.send({ action: 'create', ...account, password: 'fixture-password' })).status, 200);
  assert.equal((await api.send({ action: 'update', ...account, id: targetId, active: false })).status, 200);
  assert.equal((await api.send({ action: 'password', id: targetId, password: 'replacement-fixture' })).status, 200);
  assert.equal(api.writes.length, 4);
  assert.equal(api.writes[2].active, false);
});

test('login API rejects wrong methods, malformed JSON, invalid types and short passwords', async () => {
  const api = await endpoint('login-id');
  assert.equal((await api.send({}, { method: 'GET' })).status, 405);
  assert.equal((await api.send({}, { raw: '{' })).status, 400);
  for (const body of [null, [], { userId: 'SISWA001', password: 12345678 }, { userId: 12345, password: 'fixture-password' }, { userId: 'SISWA001', password: 'short' }]) {
    assert.equal((await api.send(body)).status, 400);
  }
  assert.equal(api.writes.length, 0);
});

test('login succeeds for active accounts and rejects inactive accounts', async () => {
  for (const role of ['student', 'teacher', 'admin']) {
    const api = await endpoint('login-id', { id: targetId, role, active: true });
    const response = await api.send({ userId: ' siswa001 ', password: 'fixture-password' });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { access_token: 'fixture-access', refresh_token: 'fixture-refresh' });
  }
  const inactive = await endpoint('login-id', { id: targetId, active: false });
  assert.equal((await inactive.send({ userId: 'SISWA001', password: 'fixture-password' })).status, 401);
});
