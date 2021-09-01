import { GetStaticProps } from 'next';
import App from '../App';
import { AppHeadProps } from '../AppHead';

export const getStaticProps: GetStaticProps<{ headProps: AppHeadProps }> =
  async () => {
    return {
      props: {
        headProps: {
          title: 'XState Visualizer',
          ogTitle: 'XState Visualizer',
          description: 'Visualizer for XState state machines and statecharts',
          importElk: true,
          importPrettier: true,
          // TODO - get an OG image for the home page
          ogImageUrl: null,
        },
      },
    };
  };

// the exported component should match the exported component from the index.tsx
// both routes render in the same way on the client-side and we want to avoid remounting the whole app
// which happens if those 2 routes export different components (because root-like component gets changed)
export default App;
