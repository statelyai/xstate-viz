import { EmbedContext } from './types';
import { createRequiredContext } from './utils';

export const [EmbedProvider, useEmbed] = createRequiredContext<
  EmbedContext | undefined
>('Embed');
