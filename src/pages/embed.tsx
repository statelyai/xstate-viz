import { GetServerSideProps } from 'next';
import { NextRouter } from 'next/router';
import App from '../App';
import { parseQuery } from '../utils';

export default function Embed({ query }: { query: NextRouter['query'] }) {
  const embed = parseQuery(query);
  return <App embed={{ ...embed, isEmbedded: true }} />;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return { props: { query: ctx.query } };
};
