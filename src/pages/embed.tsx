import { GetServerSideProps } from 'next';
import App from '../App';
import { constructOriginalUrlFromEmbed, parseEmbedQuery } from '../utils';

// TODO: figure out the TS typings for `ctx`
export default function Embed({ query, url }: { query: any; url: string }) {
  const embed = parseEmbedQuery(query);
  return (
    <App
      embed={{
        ...embed,
        isEmbedded: true,
        embedUrl: constructOriginalUrlFromEmbed(url),
      }}
    />
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return { props: { query: ctx.query, url: ctx.req.headers.referer || '' } };
};
