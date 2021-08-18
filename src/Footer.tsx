import { Box } from '@chakra-ui/layout';
import { Link } from '@chakra-ui/react';
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <Box
      padding="1"
      paddingInline="2"
      background="gray.800"
      gridArea="footer"
      display="flex"
      flexDirection="row-reverse"
    >
      <Link href="https://stately.ai/privacy" target="_blank" rel="noreferrer">
        Privacy Policy
      </Link>
    </Box>
  );
};
