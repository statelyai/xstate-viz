import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Select,
  Switch,
  Button,
  Textarea,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Spinner,
  useClipboard,
} from '@chakra-ui/react';
import { useMachine } from '@xstate/react';
import React, { useEffect, useRef } from 'react';
import { createModel } from 'xstate/lib/model';
import { EmbedMode, EmbedPanel, ParsedEmbed } from './types';
import { makeEmbedUrl, paramsToRecord } from './utils';
import { createMachine, send } from 'xstate';
import { Overlay } from './Overlay';
import { useRouter } from 'next/router';

const extractFormData = (form: HTMLFormElement): ParsedEmbed => {
  // This is needed because FormData doesn't include checkboxes that are unchecked by default
  // https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData
  const data = Array.from(form.elements)
    .filter((el) => el.nodeName.toLowerCase() !== 'fieldset')
    .map((el) => {
      const name = el.getAttribute('name');
      const nodeName = el.nodeName.toLowerCase();
      if (!name) {
        throw Error('Form element with no name found in the form');
      }
      switch (nodeName) {
        case 'select':
          return {
            name,
            value: (el as HTMLSelectElement).value,
          };
        // for now, all inputs are checkboxes
        case 'input':
          return {
            name,
            value: (el as HTMLInputElement).checked,
          };
        default:
          throw Error('Unhandled input of type: ' + el.nodeName);
      }
    });

  return paramsToRecord(data);
};

const getEmbedCodeFromUrl = (embedUrl: string) => `<iframe src="${embedUrl}"
allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>`;

const embedPreviewModel = createModel(
  {
    embedUrl: '',
    embedCode: getEmbedCodeFromUrl(''),
    params: {} as ParsedEmbed,
  },
  {
    events: {
      LOAD: () => ({}),
      LOAD_DONE: () => ({}),
      LOAD_FAILED: () => ({}),
      PARAMS_CHANGED: (params: ParsedEmbed) => ({ params }),
      COPY: () => ({}),
      READY: () => ({}),
      PREVIEW: () => ({}),
      IFRAME_LOADED: () => ({}),
      IFRAME_ERROR: () => ({}),
    },
  },
);

const embedPreviewMachine = embedPreviewModel.createMachine({
  id: 'preview',
  type: 'parallel',
  states: {
    form: {
      initial: 'ready',
      states: {
        ready: {
          entry: ['makeEmbedUrlAndCode', send('PREVIEW')],
          on: {
            PARAMS_CHANGED: {
              actions: ['saveParams'],
              internal: false,
              target: 'ready',
            },
          },
        },
      },
    },
    iframe: {
      initial: 'idle',
      on: {
        PREVIEW: '.loading',
      },
      states: {
        idle: {},
        loading: {
          tags: 'preview_loading',
          on: {
            IFRAME_LOADED: 'loaded',
            IFRAME_ERROR: 'error',
          },
        },
        loaded: {},
        error: {
          tags: 'preview_error',
        },
      },
    },
  },
});

const copyMachine = createMachine({
  initial: 'idle',
  states: {
    idle: {
      on: {
        COPY: 'copied',
      },
    },
    copied: {
      entry: 'copyEmbedCode',
      after: {
        3500: 'idle',
      },
    },
  },
});

const EmbedPreviewContent: React.FC = () => {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null!);
  const clipboard = useClipboard('');
  const [previewState, sendPreviewEvent] = useMachine(
    embedPreviewMachine.withContext({
      ...embedPreviewModel.initialContext,
      params: {
        mode: EmbedMode.Viz as const,
        panel: EmbedPanel.Code as const,
        readOnly: true,
        showOriginalLink: true,
        controls: false,
        pan: false,
        zoom: false,
      },
    }),
    {
      actions: {
        saveParams: embedPreviewModel.assign({
          params: (_, e) => (e as any).params,
        }),
        makeEmbedUrlAndCode: embedPreviewModel.assign((ctx) => {
          const url = makeEmbedUrl(
            router.query.sourceFileId as string,
            ctx.params,
          );

          return {
            embedUrl: url,
            embedCode: getEmbedCodeFromUrl(url),
            params: ctx.params,
          };
        }),
      },
    },
  );
  const [copyState, sendCopyEvent] = useMachine(copyMachine, {
    actions: {
      copyEmbedCode: () => {
        clipboard.value = previewState.context.embedCode;
        clipboard.onCopy();
      },
    },
  });

  useEffect(() => {
    const formRef = form.current;
    return () => {
      formRef.reset();
    };
  }, []);

  const isFormReady = previewState.matches({ form: 'ready' });
  const isPreviewLoading = previewState.hasTag('preview_loading');
  const isPreviewError = previewState.hasTag('preview_error');

  return (
    <Box
      display="grid"
      gridTemplateAreas={`"sidebar preview"`}
      gridTemplateColumns="auto 1fr"
    >
      <Box
        gridArea="sidebar"
        borderRight="1px dotted var(--chakra-colors-black)"
        paddingRight="2"
        opacity={!isFormReady ? 0.5 : 1}
        cursor={!isFormReady ? 'not-allowed' : 'default'}
        disabled={!isFormReady}
      >
        <VStack spacing="10">
          <form
            onChange={() => {
              sendPreviewEvent({
                type: 'PARAMS_CHANGED',
                params: extractFormData(form.current),
              });
            }}
            ref={form}
          >
            <VStack spacing="5">
              <FormControl
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <FormLabel marginBottom="0" htmlFor="mode" whiteSpace="nowrap">
                  Mode
                </FormLabel>
                <Select id="mode" name="mode" size="sm" width="auto">
                  {Object.values(EmbedMode).map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <FormLabel marginBottom="0" htmlFor="panel" whiteSpace="nowrap">
                  Active Panel
                </FormLabel>
                <Select id="panel" name="panel" size="sm" width="auto">
                  {Object.values(EmbedPanel).map((panel) => (
                    <option key={panel} value={panel}>
                      {panel}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <FormLabel
                  marginBottom="0"
                  htmlFor="readOnly"
                  whiteSpace="nowrap"
                >
                  Editor readonly
                </FormLabel>
                <Switch defaultChecked={true} id="readOnly" name="readOnly" />
              </FormControl>

              <FormControl
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <FormLabel
                  marginBottom="0"
                  htmlFor="showOriginalLink"
                  whiteSpace="nowrap"
                >
                  Show original link to visualizer
                </FormLabel>
                <Switch
                  defaultChecked={true}
                  id="showOriginalLink"
                  name="showOriginalLink"
                />
              </FormControl>

              <FormControl
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <FormLabel
                  marginBottom="0"
                  htmlFor="controls"
                  whiteSpace="nowrap"
                >
                  Show control buttons
                </FormLabel>
                <Switch defaultChecked={false} id="controls" name="controls" />
              </FormControl>

              <FormControl
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <FormLabel marginBottom="0" htmlFor="pan" whiteSpace="nowrap">
                  Allow panning
                </FormLabel>
                <Switch defaultChecked={false} id="pan" name="pan" />
              </FormControl>

              <FormControl
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <FormLabel marginBottom="0" htmlFor="zoom" whiteSpace="nowrap">
                  Allow zooming
                </FormLabel>
                <Switch defaultChecked={false} id="zoom" name="zoom" />
              </FormControl>
            </VStack>
          </form>
          <Box position="relative" width="100%">
            <Button
              size="xs"
              position="absolute"
              rounded="false"
              top="0"
              right="0"
              transform="translateY(-110%)"
              onClick={() => {
                sendCopyEvent('COPY');
              }}
            >
              {copyState.matches('copied') ? 'Copied' : 'Copy'}
            </Button>
            <Textarea
              minHeight="200px"
              readOnly
              value={previewState.context.embedCode}
            />
          </Box>
        </VStack>
      </Box>
      <Box gridArea="preview" paddingLeft="2">
        {JSON.stringify(previewState.value, null, 2)}
        {isPreviewLoading && (
          <Overlay>
            <Spinner size="lg" />
          </Overlay>
        )}
        {isPreviewError && <p>Error loading preview</p>}
        <Box position="relative" width="100%" height="0" paddingTop="56.25%">
          <iframe
            style={{
              position: 'absolute',
              height: isPreviewLoading ? 0 : '100%',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              width: '100%',
            }}
            onLoad={(e) => {
              // Found at https://stackoverflow.com/questions/15273042/catch-error-if-iframe-src-fails-to-load-error-refused-to-display-http-ww
              // If iframe isn't loaded, the contentWindow is either null or with length 0
              const iframe = e.target as HTMLIFrameElement;
              if (iframe.contentWindow?.length) {
                sendPreviewEvent('IFRAME_LOADED');
              } else {
                sendPreviewEvent('IFRAME_ERROR');
              }
            }}
            src={previewState.context.embedUrl}
          ></iframe>
        </Box>
      </Box>
    </Box>
  );
};

export const EmbedPreview: React.FC<{ isOpen: boolean; onClose(): void }> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal size="6xl" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalBody>
          <EmbedPreviewContent />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
