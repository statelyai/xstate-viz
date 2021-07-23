import {
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import { useAuth } from './authContext';
import { useSourceState } from './sourceMachine';

export const MachineNameChooserModal = () => {
  const authService = useAuth();
  const [sourceState, send] = useSourceState(authService);

  return (
    <Modal
      isOpen={sourceState.matches('creating')}
      onClose={() =>
        send({
          type: 'CLOSE_NAME_CHOOSER_MODAL',
        })
      }
    >
      <ModalOverlay />
      <ModalContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.target as HTMLFormElement);
            const name = (data.get('name') as string) || '';

            send({
              type: 'CHOOSE_NAME',
              name,
            });
          }}
        >
          <ModalHeader>Choose Name</ModalHeader>
          <ModalBody>
            <FormControl>
              <FormLabel fontSize="sm">
                Choose a name for your new machine
              </FormLabel>
              <Input type="text" name="name" placeholder="Unnamed Source" />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button
                type="button"
                onClick={() =>
                  send({
                    type: 'CLOSE_NAME_CHOOSER_MODAL',
                  })
                }
              >
                Cancel
              </Button>
              <Button type="submit" colorScheme="blue">
                Submit
              </Button>
            </HStack>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
