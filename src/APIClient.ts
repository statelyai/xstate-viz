import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface Client extends SupabaseClient {
  initialized: boolean;
}

export let client: Client = {
  initialized: false,
} as Client;

console.log(process.env);

export const initAPIClient = () => {
  client = Object.assign(
    {},
    createClient(
      process.env.REACT_APP_SUPABASE_API_URL as string,
      process.env.REACT_APP_SUPABASE_ANON_API_KEY as string,
    ),
    { initialized: true },
  );
};
