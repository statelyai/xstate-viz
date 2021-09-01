import {
  Modal,
  ModalContent,
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
import { getPlatformMetaKeyLabel } from './utils';

// this hack is needed at the moment because Chakra assumes that Menus are always used in combination with MenuButtons
// because of that logic related to auto-focusing menu items partially lives in the MenuButton and, in our case, it's just not executed here
const AutoFocusMenu = ({ isOpen }: { isOpen: boolean }) => {
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
  <MenuItem fontWeight="700" padding="5" onClick={onClick}>
    {children}
    <Box as="span" paddingLeft="10" marginLeft="auto">
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

  const close = () => send('HIDE_PALETTE');

  return (
    <Modal
      onClose={close}
      isOpen={isOpen}
      isCentered
      motionPreset="slideInBottom"
    >
      <ModalOverlay />
      <ModalContent minHeight={100} background="none" boxShadow="none">
        <ModalBody display="flex" justifyContent="center" alignItems="center">
          <Menu defaultIsOpen isOpen={true} closeOnSelect onClose={close}>
            <AutoFocusMenu isOpen={isOpen} />
            <MenuList paddingY={5}>
              <MenuListItem
                onClick={onSave}
                command={
                  <>
                    <Kbd>{getPlatformMetaKeyLabel()}</Kbd> + <Kbd>S</Kbd>
                  </>
                }
              >
                Saves or updates the code in Stately Registry
              </MenuListItem>
              <MenuListItem
                onClick={onVisualize}
                command={
                  <>
                    <Kbd> {getPlatformMetaKeyLabel()}</Kbd> + <Kbd>Enter</Kbd>
                  </>
                }
              >
                Visualizes the current editor code
              </MenuListItem>
            </MenuList>
          </Menu>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
