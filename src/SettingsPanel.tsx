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
import { useEditorTheme } from './themeContext';
import { useSimulationMode } from './SimulationContext';
import { getPlatformMetaKeyLabel } from './utils';
import {
  OrientationType,
  useVizOrientation,
} from './visualizerOrientationContext';

const KeyboardShortcuts = () => (
  <Box>
    <Heading as="h2" fontSize="l" marginBottom="5">
      Keyboard shortcuts
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
            <Kbd>{getPlatformMetaKeyLabel()}</Kbd> + <Kbd>S</Kbd>
          </Td>
          <Td>Saves or updates the code in Stately Registry</Td>
        </Tr>
        <Tr>
          <Td>
            <Kbd>{getPlatformMetaKeyLabel()}</Kbd> + <Kbd>Enter</Kbd>
          </Td>
          <Td>Visualizes the current editor code</Td>
        </Tr>
        <Tr>
          <Td>
            <VStack alignItems="flex-start">
              <span>
                <Kbd>{getPlatformMetaKeyLabel()}</Kbd> + <Kbd>K</Kbd>
              </span>
              <span>
                <Kbd>Shift</Kbd> + <Kbd>?</Kbd>
              </span>
            </VStack>
          </Td>
          <Td>Show the Command palette</Td>
        </Tr>
        <Tr>
          <Td>
            <VStack alignItems="flex-start">
              <span>
                <Kbd>Up</Kbd> , <Kbd>Left</Kbd> , <Kbd>Down</Kbd> ,{' '}
                <Kbd>Right</Kbd>
              </span>
            </VStack>
          </Td>
          <Td>
            Pan the view. Use <Kbd>Shift</Kbd> for a larger pan.
          </Td>
        </Tr>
        <Tr>
          <Td>
            <Kbd>Shift</Kbd> + <Kbd>1</Kbd>
          </Td>
          <Td>Fit to content</Td>
        </Tr>
        <Tr>
          <Td>
            <VStack alignItems="flex-start">
              <span>
                <Kbd>+</Kbd> , <Kbd>-</Kbd>
              </span>
            </VStack>
          </Td>
          <Td>Zoom-in/out</Td>
        </Tr>
      </Tbody>
    </Table>
  </Box>
);

export const SettingsPanel: React.FC = () => {
  const editorTheme = useEditorTheme();
  const simulationMode = useSimulationMode();
  const vizOrientation = useVizOrientation();
  return (
    <VStack paddingY="5" spacing="7" alignItems="stretch">
      {simulationMode === 'visualizing' && <KeyboardShortcuts />}
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
      <Box>
        <Heading as="h2" fontSize="l" marginBottom="5">
          Visualizer orientation
        </Heading>
        <Select
          maxWidth="fit-content"
          defaultValue={vizOrientation.orientation}
          onChange={(e) => {
            const orientation = e.target.value as OrientationType;
            vizOrientation.changeOrientation(orientation);
          }}
        >
          <option value="left/right">left/right</option>
          <option value="top/bottom">top/bottom</option>
        </Select>
      </Box>
    </VStack>
  );
};
