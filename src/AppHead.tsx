import Head from 'next/head';
import { featureFlags } from './featureFlags';

interface AppHeadProps {
  /**
   * @example
   * XState Visualizer | My Great Machine
   */
  title: string;
  /**
   * Og titles are expected to be more concise,
   * whereas titles in the <title> attribute
   * should be SEO-friendly
   *
   * @example
   * My Great Machine
   */
  ogTitle: string;
  importElk: boolean;
  description: string;
  importPrettier: boolean;
  ogImageUrl: string | undefined;
}

export const AppHead = (props: AppHeadProps) => {
  return (
    <Head>
      <link rel="apple-touch-icon" href="/viz/favicon@256.png" />
      <link rel="icon" href="/viz/favicon.png" />
      <title>{props.title}</title>
      <meta name="description" content={props.description} />
      {props.importElk && (
        <script src="https://unpkg.com/elkjs@0.7.1/lib/elk.bundled.js"></script>
      )}

      <meta property="og:type" content="website" />
      <meta property="og:url" content={`https://stately.ai/viz`} />
      <meta property="og:title" content={props.ogTitle} />
      <meta property="og:description" content={props.description} />
      {props.ogImageUrl && featureFlags['Show OG Images'] && (
        <meta property="og:image" content={props.ogImageUrl} />
      )}

      <meta property="twitter:card" content="summary_large_image" />
      <script
        async
        data-domain="stately.ai"
        src="https://plausible.io/js/plausible.js"
      />
    </Head>
  );
};
