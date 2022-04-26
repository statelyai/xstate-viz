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
import '../TransitionViz.scss';
import { NextComponentWithMeta } from '../types';

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

const AuthWrapper = ({ pageProps, Component }: AppProps) => {
  const router = useRouter();

  const authService = useInterpret(
    createAuthMachine({
      sourceRegistryData: pageProps.sourceRegistryData,
      router,
      isEmbbeded: pageProps.isEmbedded,
    }),
  );

  return (
    <AuthProvider value={authService}>
      <Component {...pageProps} />
    </AuthProvider>
  );
};

const MyApp = (
  props: AppProps & {
    Component: NextComponentWithMeta;
  },
) => {
  if (props.Component.preventAuth) {
    return <props.Component {...props.pageProps}></props.Component>;
  }

  return <AuthWrapper {...props}></AuthWrapper>;
};

export default MyApp;
