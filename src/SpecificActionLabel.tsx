import { Box } from '@chakra-ui/react';

export function SpecificActionLabel({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <Box
      css={{
        fontSize: 'var(--chakra-fontSizes-xs)',
        maxWidth: '15ch',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
      title={title}
    >
      {children}
    </Box>
  );
}
