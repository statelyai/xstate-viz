import { useEffect, useState } from 'react';
import { client } from './APIClient';

export const useSession = () => {
  const [session, setSession] = useState(client.auth.session());

  useEffect(() => {
    client.auth.onAuthStateChange((_, s) => {
      setSession(s);
    });
  }, []);

  return session;
};
