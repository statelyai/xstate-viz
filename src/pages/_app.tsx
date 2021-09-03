import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useInterpret } from '@xstate/react';
import { createAuthMachine } from '../authMachine';
import { AuthProvider } from '../authContext';
import '../ActionViz.scss';
import '../base.scss';
import '../DelayViz.scss';
import '../EdgeViz.scss';
import '../EventTypeViz.scss';
import '../InvokeViz.scss';
import '../monacoPatch';
import '../StateNodeViz.scss';

import Head from 'next/head';
import { parseEmbedQuery, withoutEmbedQueryParams } from '../utils';
// import { isOnClientSide } from '../isOnClientSide';

if (
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PUBLIC_SENTRY_DSN
) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    integrations: [new Integrations.BrowserTracing()],
    /**
     * This allows us to work out if a bug came
     * from staging, dev or prod
     */
    environment: process.env.NEXT_PUBLIC_DEPLOY_ENVIRONMENT,
  });
}

const MyApp = ({ pageProps, Component }: AppProps) => {
  const router = useRouter();

  const routerReplace = (url: string) => {
    /**
     * Apologies for this line of code. The reason this is here
     * is that XState + React Fast Refresh causes an error:
     *
     * Error: Unable to send event to child 'ctx => ctx.sourceRef'
     * from service 'auth'.
     *
     * router.replace causes this in development, but not in prod
     *
     * So, we use window.location.href in development (with the /viz
     * prefix which Next won't automatically add) and router.replace in prod
     */
    if (process.env.NODE_ENV === 'development') {
      window.location.href = `/viz${url}`;
    } else {
      router.replace(`${url}`);
    }
  };

  const embed = parseEmbedQuery(pageProps.query);

  const authService = useInterpret(
    createAuthMachine({
      data: pageProps.data,
      routerReplace,
      redirectToNewUrlFromLegacyUrl: () => {
        const id = new URLSearchParams(window.location.search)?.get('id');
        routerReplace(`/${id}`);
      },
      isEmbbeded: pageProps.isEmbedded,
    }),
  );
  return (
    <AuthProvider value={authService}>
      <Component
        {...pageProps}
        embed={{
          ...embed,
          isEmbedded: pageProps.isEmbedded,
          originalUrl: withoutEmbedQueryParams(pageProps.query),
        }}
      />
    </AuthProvider>
  );
};
export default MyApp;
