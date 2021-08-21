import { GetServerSideProps } from 'next';
import App from '../App';
import { parseEmbedQuery } from '../utils';

/**
 * This is a shim for now. Our app currently doesn't use
 * next routing - we're just loading the entire app in _app.tsx
 *
 * This will be fixed in a later PR, adding routes with server
 * rendering to grab OG images.
 */
const HomePage = ({ query }: { query: any }) => {
  const embed = parseEmbedQuery(query);
  return (
    <App
      embed={{
        ...embed,
        isEmbedded: false,
      }}
    />
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return { props: { query: ctx.query } };
};

export default HomePage;
