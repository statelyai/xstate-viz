import { GetServerSideProps } from 'next';
import App from '../../App';
import { AppHead } from '../../AppHead';
import { parseEmbedQuery, withoutEmbedQueryParams } from '../../utils';

/**
 * This is a shim for now. Our app currently doesn't use
 * next routing - we're just loading the entire app in _app.tsx
 *
 * This will be fixed in a later PR, adding routes with server
 * rendering to grab OG images.
 */
const InspectedEmbed = ({ query }: { query: any }) => {
  const embed = parseEmbedQuery(query);
  return (
    <>
      <AppHead
        title="XState Visualizer"
        ogTitle="XState Visualizer"
        description="Visualizer for XState state machines and statecharts"
        importElk
        importPrettier
        // TODO - get an OG image for the home page
        ogImageUrl={undefined}
      />
      <App
        embed={{
          ...embed,
          isEmbedded: true,
          originalUrl: withoutEmbedQueryParams(query),
        }}
      />
    </>
  );
};

export const getServerSideProps: GetServerSideProps<{ query: any }> = async (
  ctx,
) => {
  if (ctx.query.inspect === undefined) {
    return {
      notFound: true,
      props: {},
    };
  }
  return {
    props: { query: ctx.query },
  };
};

export default InspectedEmbed;
