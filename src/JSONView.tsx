import { vizReactJsonTheme } from './vizReactJsonTheme';
import dynamic from 'next/dynamic';
import { isOnClientSide } from './isOnClientSide';

/**
 * react-json-view has a dependency on `document`, meaning that
 * it can't be SSR'd. We use next/dynamic to fix that, ensuring
 * it only gets used client side
 *
 * We do this extra ternary crud in order to ensure that next dev
 * doesn't screw things up
 */
const ReactJson = isOnClientSide()
  ? dynamic(() => import('react-json-view'))
  : () => null;

export const JSONView: React.FC<{ src: object; name?: string }> = ({
  src,
  name,
}) => {
  return (
    <ReactJson
      src={src}
      name={name}
      theme={vizReactJsonTheme}
      collapsed={1}
      onEdit={false}
      displayDataTypes={false}
      displayObjectSize={false}
    />
  );
};
