import React from 'react';
import { isOnClientSide } from './isOnClientSide';

export const NoSSR: React.FC = ({ children }) => {
  if (isOnClientSide()) return <>{children}</>;
  return null;
};
