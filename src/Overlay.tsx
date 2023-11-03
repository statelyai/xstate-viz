import { Box, BoxProps } from '@chakra-ui/react';
import React from 'react';

export const Overlay: React.FC<BoxProps> = ({ children, ...props }) => {
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
      zIndex={props.zIndex ?? 1}
    >
      {children}
    </Box>
  );
};
