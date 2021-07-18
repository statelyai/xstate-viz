import {
  Button,
  Modal,
  ModalOverlay,
  ModalBody,
  ModalContent,
  ModalHeader,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Box,
  Text,
  Image,
  ModalFooter,
} from '@chakra-ui/react';
import { useSelector } from '@xstate/react';
import React from 'react';
import { useClient } from './clientContext';

export const Login: React.FC = () => {
  const clientService = useClient();
  const state = useSelector(clientService, (state) => state);
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
            clientService.send('CHOOSE_PROVIDER');
          }}
        >
          Login
        </Button>
      )}

      {state.hasTag('authorized') && (
        <Menu closeOnSelect={true}>
          <MenuButton title={session?.user?.user_metadata?.full_name}>
            <Image
              display="inline-flex"
              marginRight="2"
              boxSize="30px"
              src={session?.user?.user_metadata?.avatar_url}
              alt={session?.user?.email}
            />
          </MenuButton>
          <MenuList>
            <MenuItem
              onClick={() => {
                clientService.send('SIGN_OUT');
              }}
            >
              Logout
              <Box
                as="em"
                fontSize="sm"
                marginLeft="1"
                textTransform="capitalize"
              >
                ({session?.user?.app_metadata.provider})
              </Box>
            </MenuItem>
          </MenuList>
        </Menu>
      )}

      <Modal
        isOpen={clientService.state?.matches({
          signed_out: 'choosing_provider',
        })}
        onClose={() => {
          clientService.send('CANCEL_PROVIDER');
        }}
        // colorScheme="blackAlpha"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sign in</ModalHeader>
          <ModalBody>
            <Text>
              Sign in to Stately Registry to be able to save machines.
            </Text>
          </ModalBody>
          <ModalFooter justifyContent="flex-start">
            <HStack>
              <Button
                onClick={() => {
                  clientService.send({ type: 'SIGN_IN', provider: 'github' });
                }}
              >
                Github
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};
