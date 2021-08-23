import { NextPageContext } from 'next';
import App from '../App';
import { withoutEmbedQueryParams, parseEmbedQuery } from '../utils';

export default function Embed({ query }: { query: any }) {
  const embed = parseEmbedQuery(query);
  return (
    <App
      embed={{
        ...embed,
        isEmbedded: true,
        embedUrl: withoutEmbedQueryParams(query),
      }}
    />
  );
}

Embed.getInitialProps = async (ctx: NextPageContext) => {
  // console.log(ctx.req?.headers.referer, ctx.pathname, ctx.asPath,);
  return { query: ctx.query };
};
