import { EmbedMode, EmbedPanel } from './types';
import { createRequiredContext } from './utils';

export const [EmbedProvider, useEmbed] = createRequiredContext<{
  isEmbedded: boolean;
  mode: EmbedMode;
  panel: EmbedPanel;
}>('Embed');
