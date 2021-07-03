import { Box, Spinner, Text } from '@chakra-ui/react';

export const SpinnerWithText: React.FC<{ text: string }> = ({ text }) => (
  <Box
    paddingTop="6"
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
  >
    <Spinner size="xl" />
    <Text marginTop="4">{text}</Text>
  </Box>
);
