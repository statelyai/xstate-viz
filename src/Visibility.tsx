import { Box } from '@chakra-ui/react';
import React from 'react';

export const Visibility: React.FC<
  {
    isHidden: boolean;
  } & React.ComponentProps<typeof Box>
> = ({ isHidden, children, ...props }) => {
  return (
    <Box hidden={isHidden} {...(!isHidden && { ...props })}>
      {children}
    </Box>
  );
};
