import { Box } from '@chakra-ui/react';

export function ActionLabelBeforeElement({
  children,
  kind,
  title,
}: {
  children: React.ReactNode;
  kind: string;
  title?: string;
}) {
  return (
    <Box
      css={{
        color: 'var(--viz-color-fg)',
        display: 'flex',
        flexDirection: 'row',
        gap: '1ch',
        alignItems: 'baseline',
        justifyContent: 'flex-start',
      }}
      _before={{
        content: `"${kind} /"`,
        fontSize: 'var(--viz-font-size-sm)',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        opacity: '0.5',
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
      title={title}
    >
      {children}
    </Box>
  );
}
