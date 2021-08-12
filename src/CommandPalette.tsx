import {
  Modal,
  ModalContent,
  Button,
  Box,
  Kbd,
  ModalOverlay,
  useMenuContext,
  Menu,
  MenuList,
  MenuItem,
  ModalBody,
} from '@chakra-ui/react';
import { useActor } from '@xstate/react';
import React, { useLayoutEffect } from 'react';
import { ReactNode } from 'react-markdown';
import { usePalette } from './PaletteContext';

const RestoreMenuFocus = ({ isOpen }: { isOpen: boolean }) => {
  const { openAndFocusFirstItem } = useMenuContext();
  useLayoutEffect(() => {
    if (isOpen) {
      openAndFocusFirstItem();
    }
  }, [isOpen, openAndFocusFirstItem]);
  return null;
};

const MenuListItem: React.FC<{ onClick: () => void; command: ReactNode }> = ({
  onClick,
  command,
  children,
}) => (
  <MenuItem padding="5" onClick={onClick}>
    {children}
    <Box as="span" marginLeft="auto">
      {command}
    </Box>
  </MenuItem>
);

export const CommandPalette: React.FC<{
  onSave(): void;
  onVisualize(): void;
}> = ({ onSave, onVisualize }) => {
  const [current, send] = useActor(usePalette());
  const isOpen = current.matches('opened');

  const withCloseModal = (fn?: () => void) => {
    fn?.();
    send('HIDE_PALETTE');
  };

  return (
    <Modal
      size="2xl"
      onClose={() => {
        send('HIDE_PALETTE');
      }}
      isOpen={isOpen}
      isCentered
      motionPreset="slideInBottom"
      closeOnEsc
    >
      <ModalOverlay />
      <ModalContent minHeight={100} background="none" boxShadow="none">
        <ModalBody display="flex" justifyContent="center" alignItems="center">
          <Menu isOpen={isOpen}>
            <RestoreMenuFocus isOpen={isOpen} />
            <MenuList paddingY={5}>
              <MenuListItem
                onClick={() => withCloseModal(onSave)}
                command={
                  <>
                    <Kbd>Ctrl/CMD</Kbd> + <Kbd>S</Kbd>
                  </>
                }
              >
                Saves or updates the code in Stately Registry
              </MenuListItem>
              <MenuListItem
                onClick={() => withCloseModal(onVisualize)}
                command={
                  <>
                    <Kbd>Ctrl/CMD</Kbd> + <Kbd>S</Kbd>
                  </>
                }
              >
                Saves or updates the code in Stately Registry
              </MenuListItem>
            </MenuList>
          </Menu>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
