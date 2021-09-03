import App from '../App';
import { GetServerSideProps } from 'next';
import { gQuery } from '../utils';
import {
  GetSourceFileSsrDocument,
  GetSourceFileSsrQuery,
} from '../graphql/GetSourceFileSSR.generated';
import { registryLinks } from '../registryLinks';
import { AppHeadProps } from '../AppHead';

type SourceFile = NonNullable<GetSourceFileSsrQuery['getSourceFile']>;

interface SourceFileIdPageProps {
  headProps: AppHeadProps;
  sourceFile?: SourceFile;
}

const getHeadProps = (sourceFile: SourceFile): AppHeadProps => {
  return {
    title: sourceFile.name
      ? `${sourceFile.name} | XState Visualizer`
      : `XState Visualizer`,
    ogTitle: sourceFile.name || 'XState Visualizer',
    description:
      sourceFile.name || `Visualizer for XState state machines and statecharts`,
    ogImageUrl: registryLinks.sourceFileOgImage(sourceFile.id),
  };
};

export const getServerSideProps: GetServerSideProps<
  SourceFileIdPageProps,
  { sourceFileId?: string[] }
> = async (req) => {
  // dynamic pages always have `req.params` available
  const sourceFileIdParam = req.params!.sourceFileId;

  if (!sourceFileIdParam) {
    return {
      props: {
        headProps: {
          title: 'XState Visualizer',
          ogTitle: 'XState Visualizer',
          description: 'Visualizer for XState state machines and statecharts',
          // TODO - get an OG image for the home page
          ogImageUrl: null,
        },
      },
    };
  }

  const [sourceFileId] = sourceFileIdParam;

  if (req.query.ssr) {
    const sourceFile = JSON.parse(req.query.ssr as string).data;
    return {
      props: {
        sourceFile,
        headProps: getHeadProps(sourceFile),
      },
    };
  }

  const result = await gQuery(GetSourceFileSsrDocument, {
    id: sourceFileId,
  });

  const sourceFile = result.data?.getSourceFile;

  if (!sourceFile) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      sourceFile,
      headProps: getHeadProps(sourceFile),
    },
  };
};

export default App;
