import { CopyIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import {
  Button,
  HStack,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spinner,
  Text,
  useClipboard,
} from '@chakra-ui/react';
import { useMachine } from '@xstate/react';
import { Twitter } from './Icons';
import { registryLinks } from './registryLinks';
import { shareMachine } from './shareMachine';

const useShareButton = (linkText: string) => {
  const clipboard = useClipboard(linkText);

  const [state, send] = useMachine(shareMachine, {
    actions: {
      copyLinkToClipboard: () => {
        clipboard.onCopy();
      },
    },
  });

  return {
    onClickCopy: () => send('COPY_LINK'),
    isLoading: state.hasTag('loading'),
    hasCopied: state.hasTag('copied'),
  };
};

export const ShareButton = ({ sourceId }: { sourceId: string }) => {
  const linkText = window.location.href;
  const twitterText = `Check out the state machine I built in the @statelyai visualizer: ${linkText}`;

  const urlShareButton = useShareButton(linkText);
  const imageShareButton = useShareButton(
    registryLinks.sourceFileOgImage(sourceId),
  );

  return (
    <>
      <Menu>
        <MenuButton size="sm" leftIcon={<ExternalLinkIcon />} as={Button}>
          Share
        </MenuButton>
        <MenuList>
          <MenuItem onClick={urlShareButton.onClickCopy}>
            <HStack spacing="3">
              {urlShareButton.isLoading ? <Spinner size="xs" /> : <CopyIcon />}

              <Text>
                {urlShareButton.hasCopied
                  ? 'Link copied!'
                  : urlShareButton.isLoading
                  ? 'Copying...'
                  : 'Copy link'}
              </Text>
            </HStack>
          </MenuItem>
          <MenuItem
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              twitterText,
            )}`}
            as={Link}
            target="_blank"
            rel="noopener noreferrer"
            _hover={{
              textDecoration: 'none',
            }}
          >
            <HStack spacing="3">
              <Twitter fill="white" />
              <Text>Twitter</Text>
            </HStack>
          </MenuItem>
          <MenuItem onClick={imageShareButton.onClickCopy}>
            <HStack spacing="3">
              {imageShareButton.isLoading ? (
                <Spinner size="xs" />
              ) : (
                <CopyIcon />
              )}

              <Text>
                {imageShareButton.hasCopied
                  ? 'Link copied!'
                  : imageShareButton.isLoading
                  ? 'Copying...'
                  : 'Copy Image URL'}
              </Text>
            </HStack>
          </MenuItem>
        </MenuList>
      </Menu>
    </>
  );
};
