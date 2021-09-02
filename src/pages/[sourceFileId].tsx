import App from '../App';
import { GetServerSideProps } from 'next';
import { gQuery } from '../utils';
import {
  GetSourceFileSsrDocument,
  GetSourceFileSsrQuery,
} from '../graphql/GetSourceFileSSR.generated';
import { AppHead } from '../AppHead';
import { registryLinks } from '../registryLinks';

interface SourceFileIdPageProps {
  data: GetSourceFileSsrQuery['getSourceFile'];
  id: string;
}

const SourceFileIdPage = (props: SourceFileIdPageProps) => {
  return (
    <>
      <AppHead
        title={
          props.data?.name
            ? `${props.data?.name} | XState Visualizer`
            : `XState Visualizer`
        }
        ogTitle={props.data?.name || 'XState Visualizer'}
        description={
          props.data?.name ||
          `Visualizer for XState state machines and statecharts`
        }
        importElk
        importPrettier
        ogImageUrl={registryLinks.sourceFileOgImage(props.id)}
      />
      <App embed={{ isEmbedded: false }} sourceFile={props.data} />
    </>
  );
};

export const getServerSideProps: GetServerSideProps<SourceFileIdPageProps> =
  async (ctx) => {
    if (ctx.query.ssr) {
      return {
        props: JSON.parse(ctx.query.ssr as string),
      };
    }

    const sourceFileId = ctx.query.sourceFileId as string;
    const result = await gQuery(GetSourceFileSsrDocument, {
      id: sourceFileId,
    });

    if (!result.data?.getSourceFile) {
      return {
        notFound: true,
        props: {} as any,
      };
    }

    return {
      props: {
        id: sourceFileId,
        data: result.data?.getSourceFile,
      },
    };
  };

export default SourceFileIdPage;
