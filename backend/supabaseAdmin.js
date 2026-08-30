import { createClient } from '@supabase/supabase-js';

let adminClient = null;
let initializing = false;

function initAdmin() {
  if (adminClient) return adminClient;
  if (initializing) {
    throw new Error('Supabase admin client initialization in progress');
  }
  initializing = true;

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    initializing = false;
    throw new Error('Supabase admin client unavailable: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment');
  }

  adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  initializing = false;
  return adminClient;
}

export function getSupabaseAdmin() {
  return initAdmin();
}

export const supabaseAdmin = new Proxy({}, {
  get(_target, prop) {
    if (prop === '__isProxy') return true;
    const client = initAdmin();
    const val = client[prop];
    if (typeof val === 'function') return val.bind(client);
    return val;
  },
  apply(_target, thisArg, args) {
    const client = initAdmin();
    if (typeof client === 'function') return client.apply(thisArg, args);
    throw new Error('Supabase admin client is not callable');
  }
});
