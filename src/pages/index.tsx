import App from '../App';

/**
 * This is a shim for now. Our app currently doesn't use
 * next routing - we're just loading the entire app in _app.tsx
 *
 * This will be fixed in a later PR, adding routes with server
 * rendering to grab OG images.
 */
const HomePage = () => {
  return <App />;
};

export default HomePage;
