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
