import {
  Thead,
  Tbody,
  Table,
  Tr,
  Th,
  Td,
  Heading,
  Box,
  Kbd,
  VStack,
} from '@chakra-ui/react';

export const SettingsPanel: React.FC = () => {
  return (
    <Box paddingY="5" height="100%">
      <Heading as="h2" fontSize="l" marginBottom="5">
        Keyboard shorcuts
      </Heading>
      <Table size="sm">
        <Thead>
          <Tr>
            <Th>Keybinding</Th>
            <Th>Description</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>
              <Kbd>Ctrl/CMD</Kbd> + <Kbd>S</Kbd>
            </Td>
            <Td>Saves or updates the code in Stately Registry</Td>
          </Tr>
          <Tr>
            <Td>
              <Kbd>Ctrl/CMD</Kbd> + <Kbd>Enter</Kbd>
            </Td>
            <Td>Visualizes the current editor code</Td>
          </Tr>
          <Tr>
            <Td>
              <VStack alignItems="flex-start">
                <span>
                  <Kbd>Ctrl/CMD</Kbd> + <Kbd>K</Kbd>
                </span>
                <span>
                  <Kbd>Shift</Kbd> + <Kbd>?</Kbd>
                </span>
              </VStack>
            </Td>
            <Td>Show the Command palette</Td>
          </Tr>
        </Tbody>
      </Table>
    </Box>
  );
};
