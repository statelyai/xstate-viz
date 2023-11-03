import { ViewIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  ButtonProps,
  Heading,
  HStack,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useMachine, useSelector } from '@xstate/react';
import React from 'react';
import { createMachine } from 'xstate';
import { useAuth } from './authContext';
import { BoltIcon, LightbulbIcon, MagicIcon } from './Icons';
import { Overlay } from './Overlay';
import { getSourceActor } from './sourceMachine';

const Title: React.FC = ({ children }) => (
  <Text fontSize="3xl" fontWeight="semibold" letterSpacing="tighter">
    {children}
  </Text>
);

const Description: React.FC = ({ children }) => (
  <Text color="gray.200" lineHeight="tall">
    {children}
  </Text>
);

const buttonStyleProps: ButtonProps = {
  letterSpacing: 'tight',
  fontWeight: 'medium',
  bg: 'gray.700',
  _hover: {
    bg: 'gray.600',
    textDecoration: 'none',
  },
  px: '4',
  py: '2',
  justifyContent: 'start',
};

const welcomeAreaMachine = createMachine<
  {},
  | { type: 'CLICK_START_CODING' }
  | {
      type: 'CLICK_SEE_EXAMPLE';
    }
  | {
      type: 'BACK';
    }
>({
  initial: 'welcomeArea',
  states: {
    welcomeArea: {
      on: {
        CLICK_START_CODING: {
          target: 'startCodingRightAway',
        },
        CLICK_SEE_EXAMPLE: {
          target: 'seeingExample',
        },
      },
    },
    seeingExample: {
      entry: 'requestExample',
    },
    startCodingRightAway: {},
  },
});

export const WelcomeArea = () => {
  const authService = useAuth();
  const sourceService = useSelector(authService, getSourceActor);

  const [state, send] = useMachine(welcomeAreaMachine, {
    actions: {
      requestExample: () => sourceService.send('EXAMPLE_REQUESTED'),
    },
  });

  return (
    <Overlay zIndex={0}>
      <Box maxW="lg" p="4">
        {state.matches('seeingExample') && (
          <>
            <Stack spacing="4">
              <Stack spacing="2">
                <Title>Here you go!</Title>
                <Description>
                  Here's an example of a state machine modelling a data fetch.
                  You can press 'Visualize' to see the statechart appear.
                </Description>
              </Stack>
              <Link
                color="blue.300"
                fontSize="sm"
                href="https://stately.ai/docs/xstate"
                target="_blank"
                rel="noreferrer"
              >
                New to XState? Read the docs
              </Link>
            </Stack>
          </>
        )}
        {state.matches('startCodingRightAway') && (
          <>
            <Stack spacing="4">
              <Stack spacing="2">
                <Title>Go for it!</Title>
                <Description>
                  Start writing code in the right-hand panel, then press
                  'Visualize' to see the statechart appear.
                </Description>
              </Stack>
              <Link
                color="blue.300"
                fontSize="sm"
                href="https://stately.ai/docs/xstate"
                target="_blank"
                rel="noreferrer"
              >
                New to XState? Read here...
              </Link>
            </Stack>
          </>
        )}
        {state.matches('welcomeArea') && (
          <>
            <Stack spacing="3">
              <Stack spacing="6">
                <Title>
                  <Heading size="lg">Stately Visualizer</Heading>
                </Title>
                <Text color="gray.400" size="md">
                  Build state machine diagrams using XState.
                </Text>
                <Stack backgroundColor="gray.700" spacing="5" padding="6">
                  <Text>
                    This legacy visualizer is deprecated and is no longer
                    maintained.
                  </Text>
                  <Text>
                    For the best experience,{' '}
                    <Link
                      href="https://stately.ai/editor?source=viz"
                      target="_blank"
                      color="blue.300"
                      className="plausible-event-name=viz+stately-editor-button"
                    >
                      use our new Stately editor
                    </Link>{' '}
                    to build and visualize state machines with drag-and-drop, AI
                    assistance, exporting to XState V5, and more.
                  </Text>
                  <Text>
                    Full parity between the new Stately editor and this
                    visualizer is coming soon.
                    <Link
                      href="https://stately.ai/docs/visualizer"
                      target="_blank"
                      color="blue.300"
                      className="plausible-event-name=viz+docs"
                    >
                      {' '}
                      Read our docs for more information on the differences
                      between the legacy visualizer and new visualizer.
                    </Link>
                  </Text>
                  <Text>
                    <Button
                      {...buttonStyleProps}
                      as={Link}
                      href="https://stately.ai/editor?source=viz"
                      rel="noreferrer"
                      target="_blank"
                      bg="orange.600"
                      maxWidth="auto"
                      className="plausible-event-name=viz+new-visualizer"
                    >
                      <HStack spacing="4">
                        <MagicIcon color="gray.200" h="6" w="6" />
                        <Text color="gray.100">
                          Use the new Stately visualizer
                        </Text>
                      </HStack>
                    </Button>
                  </Text>
                </Stack>
                <Stack spacing="3">
                  <Heading
                    size="md"
                    paddingTop="3"
                    fontWeight="400"
                    color="gray.400"
                  >
                    Start using legacy visualizer
                  </Heading>
                  <Button
                    {...buttonStyleProps}
                    onClick={() => send('CLICK_SEE_EXAMPLE')}
                    className="plausible-event-name=viz+legacy-example"
                  >
                    <HStack spacing="4">
                      <ViewIcon color="gray.200" h="6" w="6" />
                      <Text color="gray.100">See an example</Text>
                    </HStack>
                  </Button>
                  <Button
                    {...buttonStyleProps}
                    as={Link}
                    href="http://stately.ai/docs/xstate"
                    rel="noreferrer"
                    target="_blank"
                    className="plausible-event-name=viz+docs"
                  >
                    <HStack spacing="4">
                      <LightbulbIcon color="gray.200" h="6" w="6" />
                      <Text color="gray.100">Learn how to build machines</Text>
                    </HStack>
                  </Button>
                  <Button
                    {...buttonStyleProps}
                    onClick={() => send('CLICK_START_CODING')}
                    className="plausible-event-name=viz+start-coding-using-legacy"
                  >
                    <HStack spacing="4">
                      <BoltIcon color="gray.200" h="6" w="6" />
                      <Text color="gray.100">Start coding right away</Text>
                    </HStack>
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          </>
        )}
      </Box>
    </Overlay>
  );
};
