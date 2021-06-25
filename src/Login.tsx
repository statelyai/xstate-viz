import {
  Button,
  Modal,
  ModalOverlay,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Box,
  Image,
} from '@chakra-ui/react';
import { useSelector } from '@xstate/react';
import React from 'react';
import { useClient } from './clientContext';

export const Login: React.FC = () => {
  const { isOpen, onClose, onOpen } = useDisclosure();
  const clientService = useClient();
  const s = useSelector(clientService, (s) => s);
  console.log(s);
  const session = useSelector(clientService, (state) => state.context.session);

  return (
    <Box
      position="absolute"
      right="1rem"
      top="0"
      zIndex="1"
      height="42"
      display="flex"
    >
      {!session && (
        <Button
          position="absolute"
          top="0"
          right="0"
          className="btn-login"
          zIndex="1"
          colorScheme="blue"
          rounded="false"
          onClick={onOpen}
        >
          Login
        </Button>
      )}

      {session && (
        <Menu colorScheme="blue">
          <MenuButton>
            <Image
              display="inline-flex"
              marginRight="2"
              boxSize="30px"
              src={session.user?.user_metadata?.avatar_url}
              alt={session.user?.email}
            />
            {/* Madness to get text ellipsis working with inline-flex */}
            <Box as="span" display="inline-flex">
              <Box
                as="span"
                maxWidth="100px"
                textOverflow="ellipsis"
                overflowX="hidden"
                whiteSpace="nowrap"
              >
                {session.user?.user_metadata?.full_name}
              </Box>
            </Box>
          </MenuButton>
          <MenuList>
            <MenuItem
              onClick={() => {
                clientService.send('LOGOUT');
              }}
            >
              Logout
              <Box
                as="em"
                fontSize="sm"
                marginLeft="1"
                textTransform="capitalize"
              >
                ({session.user?.app_metadata.provider})
              </Box>
            </MenuItem>
          </MenuList>
        </Menu>
      )}

      <Modal isOpen={isOpen} onClose={onClose} colorScheme="blackAlpha">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Login to Stately Regsitry</ModalHeader>
          <ModalBody>
            <HStack>
              <Button
                onClick={() => {
                  clientService.send({ type: 'LOGIN', provider: 'github' });
                }}
              >
                Github
              </Button>
            </HStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};
