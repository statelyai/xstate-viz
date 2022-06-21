import { ChakraProvider } from '@chakra-ui/react';
import { useInterpret } from '@xstate/react';
import { SimulationProvider } from './SimulationContext';
import { simulationMachine } from './simulationMachine';
import { theme } from './theme';
import { EditorThemeProvider } from './themeContext';

export const CommonAppProviders = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // don't use `devTools: true` here as it would freeze your browser
  const simService = useInterpret(simulationMachine);
  return (
    <ChakraProvider theme={theme}>
      <EditorThemeProvider>
        <SimulationProvider value={simService}>{children}</SimulationProvider>
      </EditorThemeProvider>
    </ChakraProvider>
  );
};
