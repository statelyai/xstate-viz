import {
  Avatar,
  Box,
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Portal,
} from '@chakra-ui/react';
import { useActor } from '@xstate/react';
import React from 'react';
import { useAuth, useLoggedInUserData } from './authContext';
import { registryLinks } from './registryLinks';

export const Login: React.FC<React.ComponentProps<typeof Box>> = (props) => {
  const authService = useAuth();
  const loggedInUserData = useLoggedInUserData();
  const [state] = useActor(authService);

  return (
    <Box {...props} zIndex="1" display="flex" alignItems="center">
      {!state.hasTag('authorized') && (
        <Button
          className="btn-login"
          zIndex="1"
          colorScheme="blue"
          rounded="none"
          height="100%"
          isFullWidth
          onClick={() => {
            authService.send('CHOOSE_PROVIDER');
          }}
        >
          Login
        </Button>
      )}

      {state.hasTag('authorized') && loggedInUserData && (
        <Menu closeOnSelect={true}>
          <MenuButton>
            <Avatar
              marginRight="2"
              src={loggedInUserData.avatarUrl || undefined}
              name={loggedInUserData.displayName || undefined}
              height="30px"
              width="30px"
            />
          </MenuButton>
          <Portal>
            <MenuList>
              {loggedInUserData && (
                <MenuItem
                  as="a"
                  href={registryLinks.viewUserById(loggedInUserData.id)}
                >
                  View Machines
                </MenuItem>
              )}
              <MenuItem
                onClick={() => {
                  authService.send('SIGN_OUT');
                }}
              >
                Logout
              </MenuItem>
            </MenuList>
          </Portal>
        </Menu>
      )}

      <Modal
        isOpen={state.matches({
          signed_out: 'choosing_provider',
        })}
        onClose={() => {
          authService.send('CANCEL_PROVIDER');
        }}
        // colorScheme="blackAlpha"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sign In</ModalHeader>
          <ModalBody>
            <Text fontSize="sm">
              Sign in to Stately to be able to save, fork and like machines.
            </Text>
          </ModalBody>
          <ModalFooter justifyContent="flex-start">
            <HStack>
              <Button
                onClick={() => {
                  authService.send({ type: 'SIGN_IN', provider: 'github' });
                }}
                colorScheme="blue"
              >
                GitHub
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};
