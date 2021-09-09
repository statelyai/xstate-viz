import App from '../App';
import { GetServerSideProps } from 'next';
import { gQuery } from '../utils';
import { GetSourceFileDocument } from '../graphql/GetSourceFile.generated';
import { SourceRegistryData } from '../types';

interface SourceFileIdPageProps {
  sourceRegistryData: SourceRegistryData | null;
}

export const getServerSideProps: GetServerSideProps<
  SourceFileIdPageProps,
  { sourceFileId?: string[] }
> = async (ctx) => {
  // dynamic pages always have `req.params` available
  const sourceFileIdParam = ctx.params!.sourceFileId;

  if (!sourceFileIdParam) {
    return {
      props: {
        sourceRegistryData: null,
      },
    };
  }

  const [sourceFileId] = sourceFileIdParam;

  if (ctx.query.ssr) {
    const sourceFile = JSON.parse(ctx.query.ssr as string).data;
    return {
      props: {
        sourceRegistryData: {
          ...sourceFile,
          dataSource: 'ssr',
        },
      },
    };
  }

  const sourceFileResult = await gQuery(GetSourceFileDocument, {
    id: sourceFileId,
  });

  const sourceFile = sourceFileResult.data?.getSourceFile ?? null;

  if (!sourceFile) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      sourceRegistryData: {
        ...sourceFile,
        dataSource: 'ssr',
      },
    },
  };
};

export default App;
