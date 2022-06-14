import { Box } from '@chakra-ui/react';

export const RootContainer = ({
  canvas,
  panels,
}: {
  canvas: React.ReactNode;
  panels: React.ReactNode;
}) => {
  if (!canvas && !panels) {
    throw new Error('Either canvas or panels must be enabled.');
  }
  return (
    <Box
      data-testid="app"
      data-viz-theme="dark"
      as="main"
      display="grid"
      height="100vh"
      {...(canvas && panels && { gridTemplateColumns: '1fr auto' })}
    >
      {canvas}
      {panels}
    </Box>
  );
};
