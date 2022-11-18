import {
  Avatar,
  Box,
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
} from '@chakra-ui/react';
import { useActor } from '@xstate/react';
import React from 'react';
import { useAuth } from './authContext';
import { registryLinks } from './registryLinks';

export const Login: React.FC<React.ComponentProps<typeof Box>> = (props) => {
  const authService = useAuth();
  const [state] = useActor(authService);
  const user = state.context.loggedInUserData;

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
            authService.send('EXTERNAL_SIGN_IN');
          }}
        >
          Sign In
        </Button>
      )}

      {state.hasTag('authorized') && (
        <Menu closeOnSelect={true}>
          <MenuButton>
            <Avatar
              marginRight="2"
              src={user?.avatarUrl ?? ''}
              name={user?.displayName ?? ''}
              height="30px"
              width="30px"
            />
          </MenuButton>
          <Portal>
            <MenuList>
              {state.context.loggedInUserData && (
                <MenuItem
                  as="a"
                  href={registryLinks.viewUserById(
                    state.context.loggedInUserData.id,
                  )}
                >
                  My Profile
                </MenuItem>
              )}
              <MenuItem
                onClick={() => {
                  authService.send('EXTERNAL_SIGN_OUT');
                }}
              >
                Sign Out
              </MenuItem>
            </MenuList>
          </Portal>
        </Menu>
      )}
    </Box>
  );
};
