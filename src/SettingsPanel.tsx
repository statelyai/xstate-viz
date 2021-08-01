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
  Select,
} from '@chakra-ui/react';
import { ThemeName, themes } from './editor-themes';
import { useMonacoTheme } from './themeContext';

export const SettingsPanel: React.FC = () => {
  const editorTheme = useMonacoTheme();
  return (
    <VStack paddingY="5" spacing="7" alignItems="stretch">
      <Box>
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

      <Box>
        <Heading as="h2" fontSize="l" marginBottom="5">
          Editor theme
        </Heading>
        <Select
          maxWidth="fit-content"
          defaultValue={editorTheme.theme}
          onChange={(e) => {
            const theme = e.target.value as ThemeName;
            editorTheme.switchTheme(theme);
          }}
        >
          {Object.keys(themes).map((themeName) => (
            <option value={themeName} key={themeName}>
              {themes[themeName as ThemeName].name}
            </option>
          ))}
        </Select>
      </Box>
    </VStack>
  );
};
