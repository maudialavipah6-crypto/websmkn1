import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const credentialsPath = fileURLToPath(
  new URL('./school-account-credentials.json', import.meta.url),
);
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Set SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di terminal lokal sebelum menjalankan provisioning.',
  );
}

let schoolUserAccounts;
try {
  ({ schoolUserAccounts } = await import('../src/auth/schoolAccounts.js'));
} catch (error) {
  if (error.code === 'ERR_MODULE_NOT_FOUND') {
    throw new Error(
      'Roster privat tidak ditemukan. Salin src/auth/schoolAccounts.js dari penyimpanan lokal tepercaya; file ini tidak disertakan di GitHub.',
    );
  }
  throw error;
}

const parsedUrl = new URL(supabaseUrl);
if (parsedUrl.pathname !== '/' && parsedUrl.pathname !== '') {
  throw new Error('SUPABASE_URL harus berupa URL proyek, bukan URL endpoint /rest/v1.');
}

const emailAccounts = schoolUserAccounts.map((account) => ({
  ...account,
  email: account.email.trim().toLowerCase(),
}));
const duplicateEmails = emailAccounts
  .map((account) => account.email)
  .filter((email, index, emails) => emails.indexOf(email) !== index);

if (duplicateEmails.length > 0) {
  throw new Error(`Email duplikat pada roster: ${[...new Set(duplicateEmails)].join(', ')}`);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function listAllUsers() {
  const users = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Tidak dapat membaca akun Auth: ${error.message}`);

    users.push(...data.users);
    if (data.users.length < perPage) return users;
    page += 1;
  }
}

async function readExistingCredentials() {
  try {
    const contents = await readFile(credentialsPath, 'utf8');
    const savedAccounts = JSON.parse(contents);
    if (!Array.isArray(savedAccounts)) {
      throw new Error('File kredensial lokal harus berisi array JSON.');
    }
    return new Map(savedAccounts.map((account) => [account.email, account]));
  } catch (error) {
    if (error.code === 'ENOENT') return new Map();
    throw error;
  }
}

async function saveCredentials(accounts) {
  const output = [...accounts.values()].sort((left, right) =>
    left.email.localeCompare(right.email),
  );
  await writeFile(credentialsPath, `${JSON.stringify(output, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
}

const authUsers = await listAllUsers();
const authUsersByEmail = new Map(
  authUsers
    .filter((user) => user.email)
    .map((user) => [user.email.toLowerCase(), user]),
);
const savedCredentials = await readExistingCredentials();
let createdCount = 0;
let existingCount = 0;
let resetCount = 0;

for (const account of emailAccounts) {
  let authUser = authUsersByEmail.get(account.email);
  let saved = savedCredentials.get(account.email);

  if (!authUser) {
    if (!saved || !saved.password || !['pending', 'pending-dashboard'].includes(saved.status)) {
      saved = {
        email: account.email,
        display_name: account.display_name,
        role: account.role,
        password: `A9!a${randomBytes(24).toString('base64url')}`,
        status: 'pending',
      };
      savedCredentials.set(account.email, saved);
    } else {
      saved = { ...saved, status: 'pending' };
      savedCredentials.set(account.email, saved);
    }

    await saveCredentials(savedCredentials);

    const { data, error } = await supabase.auth.admin.createUser({
      email: account.email,
      password: saved.password,
      email_confirm: true,
      user_metadata: { display_name: account.display_name },
    });
    if (error) {
      savedCredentials.set(account.email, { ...saved, status: 'failed' });
      await saveCredentials(savedCredentials);
      throw new Error(`Gagal membuat akun ${account.email}: ${error.message}`);
    }
    if (!data.user) {
      throw new Error(`Supabase tidak mengembalikan user setelah membuat ${account.email}.`);
    }

    authUser = data.user;
    authUsersByEmail.set(account.email, authUser);
    saved = { ...saved, status: 'created' };
    savedCredentials.set(account.email, saved);
    await saveCredentials(savedCredentials);
    createdCount += 1;
  } else {
    saved = saved || {
      email: account.email,
      display_name: account.display_name,
      role: account.role,
      password: null,
      status: 'already-existed',
    };

    if (saved.password && ['created', 'password-reset'].includes(saved.status)) {
      saved = {
        ...saved,
        display_name: account.display_name,
        role: account.role,
      };
    } else if (saved.password && saved.status === 'pending') {
      saved = {
        ...saved,
        display_name: account.display_name,
        role: account.role,
        status: 'created',
      };
    } else {
      if (!saved.password || !['pending-reset', 'pending-dashboard'].includes(saved.status)) {
        saved = {
          email: account.email,
          display_name: account.display_name,
          role: account.role,
          password: `A9!a${randomBytes(24).toString('base64url')}`,
          status: 'pending-reset',
        };
      } else {
        saved = { ...saved, status: 'pending-reset' };
      }
      savedCredentials.set(account.email, saved);
      await saveCredentials(savedCredentials);

      const { error } = await supabase.auth.admin.updateUserById(
        authUser.id,
        { password: saved.password },
      );
      if (error) {
        savedCredentials.set(account.email, { ...saved, status: 'failed' });
        await saveCredentials(savedCredentials);
        throw new Error(`Gagal memperbarui kata sandi ${account.email}: ${error.message}`);
      }

      saved = { ...saved, status: 'password-reset' };
      savedCredentials.set(account.email, saved);
      await saveCredentials(savedCredentials);
      resetCount += 1;
    }

    savedCredentials.set(account.email, {
      ...saved,
      display_name: account.display_name,
      role: account.role,
    });
    existingCount += 1;
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: authUser.id,
        display_name: account.display_name,
        role: account.role,
      },
      { onConflict: 'id' },
    );
  if (profileError) {
    await saveCredentials(savedCredentials);
    throw new Error(`Akun ${account.email} dibuat, tetapi profil gagal disiapkan: ${profileError.message}`);
  }

  await saveCredentials(savedCredentials);
  console.log(`Profil siap: ${account.email} (${account.role})`);
}

console.log(
  `Selesai. ${createdCount} akun dibuat, ${resetCount} kata sandi akun lama diatur ulang, ${existingCount} akun sudah ada. Kredensial lokal: ${credentialsPath}`,
);
