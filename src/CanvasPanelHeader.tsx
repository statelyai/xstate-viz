import { Box, Link } from '@chakra-ui/react';
import React from 'react';
import { Logo } from './Logo';

export const CanvasPanelHeader: React.FC = () => {
  return (
    <Box zIndex={1} display="flex" alignItems="center" height="3rem">
      <Link
        href="https://stately.ai"
        title="Stately.ai"
        display="block"
        height="100%"
        _hover={{
          opacity: 0.8,
        }}
        target="_blank"
        rel="noreferrer"
      >
        <Logo
          fill="white"
          style={{
            // @ts-ignore
            '--fill': 'white',
            height: '100%',
            padding: '0 .5rem',
          }}
          aria-label="Stately"
        />
      </Link>
    </Box>
  );
};
