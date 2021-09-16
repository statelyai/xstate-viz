import { Button, Text } from '@chakra-ui/react';
import { useMachine, useSelector } from '@xstate/react';
import React, { useEffect } from 'react';
import { useAuth } from './authContext';
import { getSupabaseClient } from './authMachine';
import { AddLikeDocument } from './graphql/AddLike.generated';
import { RemoveLikeDocument } from './graphql/RemoveLike.generated';
import { HeartIcon, HeartOutlinedIcon } from './Icons';
import { likesMachine } from './likesMachine';
import { useSourceActor } from './sourceMachine';
import { gQuery } from './utils';

export const LikeButton = () => {
  const authService = useAuth();
  const supabaseClient = useSelector(authService, getSupabaseClient);

  const [sourceState] = useSourceActor();

  const [state, send] = useMachine(likesMachine, {
    guards: {
      isLoggedIn: () => {
        return Boolean(supabaseClient.auth.session());
      },
    },
    services: {
      like: async () => {
        const accessToken = supabaseClient.auth.session()?.access_token;
        await gQuery(
          AddLikeDocument,
          {
            sourceFileId: sourceState.context.sourceID,
          },
          accessToken,
        );
      },
      unlike: async () => {
        const accessToken = supabaseClient.auth.session()?.access_token;
        await gQuery(
          RemoveLikeDocument,
          {
            sourceFileId: sourceState.context.sourceID,
          },
          accessToken,
        );
      },
    },
    actions: {
      reportLoggedOutUserTriedToLike: () => {
        authService.send('LOGGED_OUT_USER_ATTEMPTED_RESTRICTED_ACTION');
      },
    },
  });

  useEffect(() => {
    send({
      type: 'SOURCE_DATA_CHANGED',
      data: sourceState.context.sourceRegistryData,
    });
  }, [sourceState.context.sourceRegistryData, send]);

  const userHasLiked = state.hasTag('liked');

  if (state.hasTag('hidden')) {
    return null;
  }

  return (
    <Button
      leftIcon={
        userHasLiked ? (
          <HeartIcon w={4} h={4} fill="gray.200" />
        ) : (
          <HeartOutlinedIcon w={4} h={4} fill="gray.200" />
        )
      }
      color="gray.100"
      size="sm"
      onClick={() => {
        send('LIKE_BUTTON_TOGGLED');
      }}
      isLoading={state.hasTag('pending')}
      loadingText={`${state.context.likesCount || 0}`}
    >
      <Text fontWeight="bold">{state.context.likesCount}</Text>
    </Button>
  );
};
