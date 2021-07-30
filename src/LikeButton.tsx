import { Button, Text } from '@chakra-ui/react';
import { useInterpret, useMachine, useSelector } from '@xstate/react';
import React, { useEffect } from 'react';
import { useAuth } from './authContext';
import { getSupabaseClient } from './authMachine';
import { AddLikeDocument } from './graphql/AddLike.generated';
import { RemoveLikeDocument } from './graphql/RemoveLike.generated';
import { Heart, HeartOutlined } from './Icons';
import { likesMachine } from './likesMachine';
import { notifMachine } from './notificationMachine';
import { useSourceActor } from './sourceMachine';
import { gQuery } from './utils';

export const LikeButton = () => {
  const authService = useAuth();
  const supabaseClient = useSelector(authService, getSupabaseClient);

  const [sourceState] = useSourceActor(authService);

  const notificationService = useInterpret(notifMachine);

  const [state, send] = useMachine(likesMachine, {
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
      reportUnlikeFailed: () => {
        notificationService.send({
          type: 'BROADCAST',
          message: 'Unliking failed - an unknown error occurred.',
          status: 'error',
        });
      },
      reportLikeFailed: () => {
        notificationService.send({
          type: 'BROADCAST',
          message: 'Liking failed - an unknown error occurred.',
          status: 'error',
        });
      },
    },
  });

  useEffect(() => {
    send({
      type: 'LIKES_CHANGED',
      youHaveLiked: sourceState.context.sourceRegistryData?.youHaveLiked,
      likesCount: sourceState.context.sourceRegistryData?.likesCount,
    });
  }, [
    sourceState.context.sourceRegistryData?.youHaveLiked,
    sourceState.context.sourceRegistryData?.likesCount,
    send,
  ]);

  const userHasLiked = state.hasTag('liked');

  if (state.hasTag('hidden')) {
    return null;
  }

  return (
    <Button
      leftIcon={
        userHasLiked ? (
          <Heart w={4} h={4} fill="gray.200" />
        ) : (
          <HeartOutlined w={4} h={4} fill="gray.200" />
        )
      }
      color="gray.100"
      size="sm"
      onClick={() => {
        send('CLICK_BUTTON');
      }}
      isLoading={state.hasTag('pending')}
      loadingText={`${state.context.likesCount || 0}`}
    >
      <Text fontWeight="bold">{state.context.likesCount}</Text>
    </Button>
  );
};
