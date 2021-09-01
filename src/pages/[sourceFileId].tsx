import App from '../App';
import { GetServerSideProps } from 'next';
import { gQuery } from '../utils';
import {
  GetSourceFileSsrDocument,
  GetSourceFileSsrQuery,
} from '../graphql/GetSourceFileSSR.generated';
import { registryLinks } from '../registryLinks';

interface SourceFileIdPageProps {
  data: GetSourceFileSsrQuery['getSourceFile'];
  id: string;
}

export const getServerSideProps: GetServerSideProps<SourceFileIdPageProps> =
  async (req) => {
    if (req.query.ssr) {
      return {
        props: JSON.parse(req.query.ssr as string),
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
        headProps: {
          title: sourceFile.name
            ? `${sourceFile.name} | XState Visualizer`
            : `XState Visualizer`,
          ogTitle: sourceFile.name || 'XState Visualizer',
          description:
            sourceFile.name ||
            `Visualizer for XState state machines and statecharts`,
          importElk: true,
          importPrettier: true,
          ogImageUrl: registryLinks.sourceFileOgImage(sourceFileId),
        },
      },
    };
  };

// the exported component should match the exported component from the [sourceFileId].tsx
// both routes render in the same way on the client-side and we want to avoid remounting the whole app
// which happens if those 2 routes export different components (because root-like component gets changed)
export default App;
