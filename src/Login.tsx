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
} from '@chakra-ui/react';
import { useSelector } from '@xstate/react';
import React from 'react';
import { useAuth } from './authContext';

export const Login: React.FC = () => {
  const authService = useAuth();
  const state = useSelector(authService, (state) => state);
  const session = state.context!.client.auth.session();

  return (
    <Box
      position="absolute"
      right="1rem"
      top="0"
      zIndex="1"
      height="42"
      display="flex"
    >
      {!state.hasTag('authorized') && (
        <Button
          position="absolute"
          top="0"
          right="0"
          className="btn-login"
          zIndex="1"
          colorScheme="blue"
          rounded="false"
          onClick={() => {
            authService.send('CHOOSE_PROVIDER');
          }}
        >
          Login
        </Button>
      )}

      {state.hasTag('authorized') && (
        <Menu closeOnSelect={true}>
          <MenuButton title={session?.user?.user_metadata?.full_name}>
            <Avatar
              marginRight="2"
              src={session?.user?.user_metadata?.avatar_url || ''}
              name={session?.user?.user_metadata?.display_name || ''}
              height="30px"
              width="30px"
            />
          </MenuButton>
          <MenuList>
            <MenuItem
              onClick={() => {
                authService.send('SIGN_OUT');
              }}
            >
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      )}

      <Modal
        isOpen={authService.state?.matches({
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
              Sign in to Stately Registry to be able to save/fork machines.
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
