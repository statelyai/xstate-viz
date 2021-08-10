import { Box } from '@chakra-ui/react';
import React from 'react';

export const Overlay: React.FC = ({ children }) => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      position="absolute"
      height="100%"
      width="100%"
      background="blackAlpha.100"
      zIndex={1}
    >
      {children}
    </Box>
  );
};
