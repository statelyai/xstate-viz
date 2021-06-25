import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface Client extends SupabaseClient {
  initialized: boolean;
}

export let client: Client = {
  initialized: false,
} as Client;

export const initAPIClient = () => {
  client = Object.assign(
    {},
    createClient(
      process.env.REACT_APP_SUPABASE_API_URL,
      process.env.REACT_APP_SUPABASE_ANON_API_KEY,
    ),
    { initialized: true },
  );
};
