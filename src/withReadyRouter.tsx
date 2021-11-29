import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

/**
 * Ensures that Next's router is always ready (i.e. has
 * query params loaded)
 */
export const withReadyRouter = (WrappedComponent: any) => {
  WrappedComponent.displayName = `WithReadyRouter${WrappedComponent.displayName}`;

  const WithReadyRouter = () => {
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
      setIsReady(router.isReady);
    }, [router.isReady]);

    if (!isReady) return null;

    return <WrappedComponent />;
  };

  return WithReadyRouter;
};
