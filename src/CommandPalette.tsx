import {
  Modal,
  ModalContent,
  List,
  ListItem,
  Button,
  Box,
  Kbd,
} from '@chakra-ui/react';
import { useActor } from '@xstate/react';
import React from 'react';
import { usePalette } from './PaletteContext';

const CommandButton: React.FC<{ onClick(): void }> = ({
  children,
  onClick,
}) => (
  <Button
    rounded="none"
    paddingLeft="5"
    paddingRight="5"
    display="inline-flex"
    justifyContent="flex-start"
    alignItems="center"
    _focus={{
      borderLeft: '5px solid var(--chakra-colors-blue-300)',
    }}
    isFullWidth
    variant="unstyled"
    onClick={onClick}
  >
    {children}
  </Button>
);

export const CommandPalette: React.FC<{
  onSave(): void;
  onVisualize(): void;
}> = ({ onSave, onVisualize }) => {
  const [current, send] = useActor(usePalette());

  return (
    <Modal
      size="lg"
      onClose={() => {
        send('HIDE_PALETTE');
      }}
      isOpen={current.matches('opened')}
      isCentered
      motionPreset="slideInBottom"
      autoFocus
    >
      <ModalContent>
        <List spacing="5" paddingY="5">
          <ListItem borderRadius="0">
            <CommandButton
              onClick={() => {
                onSave();
                send('HIDE_PALETTE');
              }}
            >
              Saves or updates the code in Stately Registry{' '}
              <Box as="span" marginLeft="auto">
                <Kbd>Ctrl/CMD</Kbd> + <Kbd>S</Kbd>
              </Box>
            </CommandButton>
          </ListItem>
          <ListItem>
            <CommandButton
              onClick={() => {
                onVisualize();
                send('HIDE_PALETTE');
              }}
            >
              Visualizes the current editor code
              <Box as="span" marginLeft="auto">
                <Kbd>Ctrl/CMD</Kbd> + <Kbd>Enter</Kbd>
              </Box>
            </CommandButton>
          </ListItem>
        </List>
      </ModalContent>
    </Modal>
  );
};
