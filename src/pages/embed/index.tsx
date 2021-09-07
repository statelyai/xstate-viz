import { GetServerSideProps } from 'next';
import App from '../../App';
import { AppHead } from '../../AppHead';

const InspectedEmbed = (pageProps: { isEmbedded: boolean }) => {
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
      <App isEmbedded={pageProps.isEmbedded} />
    </>
  );
};

export const getServerSideProps: GetServerSideProps<{ isEmbedded: boolean }> =
  async (ctx) => {
    if (ctx.query.inspect === undefined) {
      return {
        notFound: true,
        props: { isEmbedded: false },
      };
    }

    return { props: { isEmbedded: true } };
  };

export default InspectedEmbed;
