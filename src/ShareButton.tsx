import { CopyIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import {
  Button,
  HStack,
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
import { shareMachine } from './shareMachine';

export const ShareButton = () => {
  const linkText = window.location.href;
  const twitterText = `Check out the machine I built in the @statelyai visualizer! ${linkText}`;

  const clipboard = useClipboard(linkText);
  const [state, send] = useMachine(shareMachine, {
    actions: {
      copyLinkToClipboard: () => {
        clipboard.onCopy();
      },
      openTwitterShareLink: () => {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            twitterText,
          )}`,
        );
      },
    },
  });
  return (
    <>
      <Menu>
        <MenuButton
          size="sm"
          leftIcon={<ExternalLinkIcon />}
          onClick={() => send('CLICK_SHARE')}
          as={Button}
        >
          Share
        </MenuButton>
        <MenuList>
          <MenuItem onClick={() => send('COPY_LINK')}>
            <HStack spacing="3">
              {state.hasTag('loading') ? <Spinner size="xs" /> : <CopyIcon />}

              <Text>
                {state.hasTag('copied')
                  ? 'Link copied!'
                  : state.hasTag('loading')
                  ? 'Copying...'
                  : 'Copy link'}
              </Text>
            </HStack>
          </MenuItem>
          <MenuItem onClick={() => send('SHARE_ON_TWITTER')}>
            <HStack spacing="3">
              <Twitter fill="white" />
              <Text>Twitter</Text>
            </HStack>
          </MenuItem>
        </MenuList>
      </Menu>
    </>
  );
};
