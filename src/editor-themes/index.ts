import xstateViz from './xstate-viz';
import nightowl from './nightowl';
import allHallowsEve from './allHallowsEve';
import amy from './amy';

export const themes = {
  xstateViz,
  nightowl,
  allHallowsEve,
  amy,
};
export type ThemeName = keyof typeof themes;
