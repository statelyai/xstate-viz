import { createClient, SupabaseClient } from '@supabase/supabase-js';

// TODO: keep in env variable
const APIKEY_ANON_PUBLIC =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMzkzNTUzOCwiZXhwIjoxOTM5NTExNTM4fQ.srHSjKsgKFPREW6M0jGbFrvIWsmI0XfSTthBTFOZXI8';

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
      'https://owxhbmonbfrgnegwprcq.supabase.co',
      APIKEY_ANON_PUBLIC,
    ),
    { initialized: true },
  );
};
