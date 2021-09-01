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
  sourceFile: SourceFile;
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

export const getServerSideProps: GetServerSideProps<SourceFileIdPageProps> =
  async (req) => {
    if (req.query.ssr) {
      const sourceFile = JSON.parse(req.query.ssr as string).data;
      return {
        props: {
          sourceFile,
          headProps: getHeadProps(sourceFile),
        },
      };
    }

    const sourceFileId = req.query.sourceFileId as string;
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

// the exported component should match the exported component from the [sourceFileId].tsx
// both routes render in the same way on the client-side and we want to avoid remounting the whole app
// which happens if those 2 routes export different components (because root-like component gets changed)
export default App;
