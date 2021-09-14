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
import { useSourceActor } from './sourceMachine';

export const MachineNameChooserModal = () => {
  const [sourceState, send] = useSourceActor();

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
              <FormLabel fontSize="sm">Choose a name for your fork</FormLabel>
              <Input
                type="text"
                name="name"
                placeholder="Unnamed Source"
                defaultValue={sourceState.context.desiredMachineName || ''}
              />
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
                disabled={sourceState.hasTag('persisting')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme="blue"
                isLoading={sourceState.hasTag('persisting')}
              >
                Submit
              </Button>
            </HStack>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
