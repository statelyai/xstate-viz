import { ViewIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  ButtonProps,
  HStack,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useMachine, useSelector } from '@xstate/react';
import React from 'react';
import { createMachine } from 'xstate';
import { useAuth } from './authContext';
import { BoltIcon, LightbulbIcon } from './Icons';
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
    <Overlay>
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
                href="https://xstate.js.org/docs"
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
                href="https://xstate.js.org/docs"
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
            <Stack spacing="6">
              <Stack>
                <Title>XState Visualizer</Title>
                <Description>
                  Welcome to the visualizer! Here, you can build state machine
                  diagrams using XState.
                </Description>
              </Stack>
              <Stack spacing="3">
                <Button
                  {...buttonStyleProps}
                  onClick={() => send('CLICK_SEE_EXAMPLE')}
                >
                  <HStack spacing="4">
                    <ViewIcon color="gray.200" h="6" w="6" />
                    <Text color="gray.100">See an example</Text>
                  </HStack>
                </Button>
                <Button
                  {...buttonStyleProps}
                  as={Link}
                  href="http://xstate.js.org/docs"
                  rel="noreferrer"
                  target="_blank"
                >
                  <HStack spacing="4">
                    <LightbulbIcon color="gray.200" h="6" w="6" />
                    <Text color="gray.100">Learn how to build machines</Text>
                  </HStack>
                </Button>
                <Button
                  {...buttonStyleProps}
                  onClick={() => send('CLICK_START_CODING')}
                >
                  <HStack spacing="4">
                    <BoltIcon color="gray.200" h="6" w="6" />
                    <Text color="gray.100">Start coding right away</Text>
                  </HStack>
                </Button>
              </Stack>
            </Stack>
          </>
        )}
      </Box>
    </Overlay>
  );
};
