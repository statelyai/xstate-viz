import App from '../App';
import { AppHead } from '../AppHead';

const HomePage = () => {
  return (
    <>
      <AppHead
        title="XState Visualiser"
        description="Visualizer for XState state machines and statecharts"
        importElk
        importPrettier
        // TODO - get an OG image for the home page
        ogImageUrl={undefined}
      />
      <App sourceFile={undefined} />
    </>
  );
};

export default HomePage;
