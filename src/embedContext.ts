import { createContext, useContext } from 'react';
import { EmbedContext } from './types';

const EmbedReactContext = createContext(null as EmbedContext);

export const EmbedProvider = EmbedReactContext.Provider;

export const useEmbed = () => useContext(EmbedReactContext);
