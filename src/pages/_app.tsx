import '../monacoPatch';
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';
import type { AppProps } from 'next/app';
import App from '../App';
import '../base.scss';
import '../TransitionViz.scss';
import '../ActionViz.scss';
import '../InvokeViz.scss';
import '../StateNodeViz.scss';
import '../EventTypeViz.scss';
import '../EdgeViz.scss';
import Head from 'next/head';

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

function MyApp({ pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="apple-touch-icon" href="/favicon@256.png" />
        <link rel="icon" href="/favicon.png" />
        <meta
          name="description"
          content="Visualizer for XState state machines and statecharts"
        />
        <script src="https://unpkg.com/prettier@2.3.2/standalone.js"></script>
        <script src="https://unpkg.com/prettier@2.3.2/parser-typescript.js"></script>
        <script src="https://unpkg.com/elkjs@0.7.1/lib/elk.bundled.js"></script>
      </Head>{' '}
      <App {...pageProps} />
    </>
  );
}
export default MyApp;
