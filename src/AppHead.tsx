import Head from 'next/head';

interface AppHeadProps {
  title: string;
  /**
   * Og titles are expected to be more concise,
   * whereas titles in the <title> attribute
   * should be SEO-friendly
   *
   * ogTitle: My Great Machine
   * title: XState Visualizer | My Great Machine
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
      {props.importPrettier && (
        <>
          <script src="https://unpkg.com/prettier@2.3.2/standalone.js"></script>
          <script src="https://unpkg.com/prettier@2.3.2/parser-typescript.js"></script>
        </>
      )}
      {props.importElk && (
        <script src="https://unpkg.com/elkjs@0.7.1/lib/elk.bundled.js"></script>
      )}

      <meta property="og:type" content="website" />
      <meta property="og:url" content={`https://stately.ai/viz`} />
      <meta property="og:title" content={props.ogTitle} />
      <meta property="og:description" content={props.description} />
      {props.ogImageUrl && (
        <meta property="og:image" content={props.ogImageUrl} />
      )}

      <meta property="twitter:card" content="summary_large_image" />
    </Head>
  );
};
