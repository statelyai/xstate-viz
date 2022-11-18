import { GetServerSideProps } from 'next';
import { SourceFile } from '../apiTypes';
import App from '../App';
import { SourceRegistryData } from '../types';
import { callAPI } from '../utils';

export interface SourceFileIdPageProps {
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

  console.log('fetching source file', sourceFileId);

  let sourceFile: SourceFile | null = null;

  try {
    const sourceFileResult = await callAPI<SourceFile | null>({
      endpoint: 'get-source-file',
      queryParams: new URLSearchParams({
        sourceFileId,
      }),
    });
    sourceFile = sourceFileResult.data;
  } catch (error) {
    console.log('error fetching source file', error);
  }

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
