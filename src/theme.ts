// 1. import `extendTheme` function
import { extendTheme, ThemeConfig } from '@chakra-ui/react';
// 2. Add your color mode config
const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

// 3. extend the theme
export const theme = extendTheme({
  config,
  styles: {
    global: {
      '*, *:before, *:after': {
        position: 'relative',
      },
      body: {
        overflow: 'hidden',
        overscrollBehavior: 'none',
        fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif`,

        background: 'var(--viz-color-bg)',
        color: 'var(--viz-color-fg)',

        '--viz-color-transparent': '#fff6',
        '--viz-color-active': '#679ae7',
        '--viz-border-color': 'var(--viz-node-color-bg)',
        '--viz-border-width': '2px',
        '--viz-border': 'var(--viz-border-width) solid var(--viz-border-color)',
        '--viz-radius': '0.25rem',
        '--viz-node-border-style': 'solid',
        '--viz-node-parallel-border-style': 'dashed',
        '--viz-font-size-base': '14px',
        '--viz-font-size-sm': '12px',

        '--viz-color-fg': '#fff',
        '--viz-color-bg': '#111',
        '--viz-node-color-bg': '#2d2d2d',
        '--viz-edge-color': 'white',
      },
      '#root': {
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
      },
      '.monaco-editor *': {
        position: 'static',
      },
    },
  },
  components: {
    Button: {
      variants: {
        secondary: {
          bg: 'gray.600',
          color: 'white',
          _hover: {
            bg: 'gray.400',
          },
        },
        secondaryPressed: {
          bg: 'gray.600',
          color: '#679ae7',
          _hover: {
            bg: '#679ae7',
            color: 'white',
          },
        },
      },
    },
  },
});
