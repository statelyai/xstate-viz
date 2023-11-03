import { EditIcon, HamburgerIcon } from '@chakra-ui/icons';
import {
  Avatar,
  HStack,
  IconButton,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
} from '@chakra-ui/react';
import React from 'react';
import { useLoggedInUserData } from './authContext';
import { LikeButton } from './LikeButton';
import { Logo } from './Logo';
import { registryLinks } from './registryLinks';
import { ShareButton } from './ShareButton';
import { useSourceActor } from './sourceMachine';

export const CanvasHeader: React.FC = () => {
  const [sourceState] = useSourceActor();

  const loggedInUserData = useLoggedInUserData();
  const registryData = sourceState.context.sourceRegistryData;
  const userOwnsSource =
    loggedInUserData?.id === registryData?.project?.owner?.id;
  return (
    <HStack zIndex={1} justifyContent="space-between" height="3rem">
      <Link
        href="/"
        title="Stately.ai"
        display="block"
        height="100%"
        _hover={{
          opacity: 0.8,
        }}
        target="_blank"
        rel="noreferrer"
        className="plausible-event-name=viz+stately-logo"
      >
        <Logo
          fill="white"
          style={{
            // @ts-ignore
            '--fill': 'white',
            height: '100%',
            padding: '0 .5rem',
          }}
          aria-label="Stately"
        />
      </Link>
      {registryData && (
        <Stack direction="row" spacing="4" alignItems="center" pr="4">
          <Text fontWeight="semibold" fontSize="sm" color="gray.100">
            {registryData?.project?.name || 'Unnamed Source'}
          </Text>
          <HStack>
            <LikeButton />
            <ShareButton sourceId={registryData.id} />
            <Menu closeOnSelect>
              <MenuButton
                as={IconButton}
                aria-label="Menu"
                icon={<HamburgerIcon />}
                size="sm"
              />
              <MenuList>
                {userOwnsSource &&
                  sourceState.context.sourceRegistryData?.project?.id && (
                    <MenuItem
                      as="a"
                      href={registryLinks.editSystem(
                        sourceState.context.sourceRegistryData?.project?.id,
                      )}
                    >
                      <HStack spacing="3">
                        <EditIcon />
                        <Text>Edit</Text>
                      </HStack>
                    </MenuItem>
                  )}
                {registryData.project?.owner && (
                  <MenuItem
                    as="a"
                    href={registryLinks.viewUserById(
                      registryData?.project?.owner?.id,
                    )}
                  >
                    <HStack spacing="3">
                      <Avatar
                        src={registryData.project?.owner?.avatarUrl || ''}
                        name={registryData.project?.owner?.displayName || ''}
                        size="xs"
                        height="24px"
                        width="24px"
                      ></Avatar>
                      <Text>View Author</Text>
                    </HStack>
                  </MenuItem>
                )}
              </MenuList>
            </Menu>
          </HStack>
        </Stack>
      )}
    </HStack>
  );
};
