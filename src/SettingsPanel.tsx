import {
  Thead,
  Tbody,
  Table,
  Tr,
  Th,
  Td,
  Heading,
  Box,
  Code,
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
              <Code colorScheme="blue">Ctrl/CMD + B</Code>
            </Td>
            <Td>Saves or updates the code in Stately Registry</Td>
          </Tr>
          <Tr>
            <Td>
              <Code colorScheme="blue">Ctrl/CMD + S</Code>
            </Td>
            <Td>Visualizes the current editor code</Td>
          </Tr>
        </Tbody>
      </Table>
    </Box>
  );
};
