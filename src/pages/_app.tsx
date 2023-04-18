import { useInterpret } from '@xstate/react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import '../ActionViz.scss';
import '../DelayViz.scss';
import '../EdgeViz.scss';
import '../EventTypeViz.scss';
import '../InvokeViz.scss';
import '../StateNodeViz.scss';
import '../TransitionViz.scss';
import { AuthProvider } from '../authContext';
import { createAuthMachine } from '../authMachine';
import '../base.scss';
import '../monacoPatch';

// import { isOnClientSide } from '../isOnClientSide';

const MyApp = ({ pageProps, Component }: AppProps) => {
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

export default MyApp;
