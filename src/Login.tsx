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
import { useActor, useSelector } from '@xstate/react';
import React from 'react';
import { useAuth } from './authContext';
import { registryLinks } from './registryLinks';

export const Login: React.FC = () => {
  const authService = useAuth();
  const [state] = useActor(authService);
  const session = state.context!.client.auth.session();

  return (
    <Box zIndex="1" height="42" display="flex">
      {!state.hasTag('authorized') && (
        <Button
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
            {state.context.loggedInUserData && (
              <MenuItem
                as="a"
                href={registryLinks.viewUserById(
                  state.context.loggedInUserData?.id,
                )}
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
