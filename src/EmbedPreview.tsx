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
  Center,
} from '@chakra-ui/react';
import { useMachine } from '@xstate/react';
import React, { useEffect, useRef, useState } from 'react';
import { createModel } from 'xstate/lib/model';
import { EmbedMode, EmbedPanel, ParsedEmbed } from './types';
import { DEFAULT_EMBED_PARAMS, makeEmbedUrl, paramsToRecord } from './utils';
import { send, assign, ContextFrom } from 'xstate';
import { Overlay } from './Overlay';
import { useRouter } from 'next/router';
import { pure } from 'xstate/lib/actions';

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

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox
 */
const getEmbedCodeFromUrl = (embedUrl: string) => `<iframe src="${embedUrl}" sandbox="allow-same-origin allow-scripts"></iframe>`;

const embedPreviewModel = createModel(
  {
    loaded: false,
    iframe: null as HTMLIFrameElement | null,
    embedUrl: '',
    previewUrl: '', // Only the initial embedUrl for the iframe element. Consecutive previews will only update embedUrl to avoid refreshing the iframe
    embedCode: getEmbedCodeFromUrl(''),
    params: {
      mode: EmbedMode.Viz,
      panel: EmbedPanel.Code,
      readOnly: true,
      showOriginalLink: true,
      controls: false,
      pan: false,
      zoom: false,
    } as ParsedEmbed,
  },
  {
    events: {
      PARAMS_CHANGED: (params: ParsedEmbed) => ({ params }),
      PREVIEW: () => ({}),
      IFRAME_READY: (iframe: HTMLIFrameElement) => ({ iframe }),
      IFRAME_LOADED: () => ({}),
      IFRAME_ERROR: () => ({}),
      RETRY: () => ({}),
    },
  },
);

const embedPreviewMachine = embedPreviewModel.createMachine({
  id: 'preview',
  type: 'parallel',
  preserveActionOrder: false, // TODO: remove this after we figured why this makes a bug
  states: {
    form: {
      initial: 'ready',
      states: {
        ready: {
          entry: [
            'makeEmbedUrlAndCode',
            pure((ctx: ContextFrom<typeof embedPreviewModel>) => {
              if (!ctx.loaded) {
                return { type: 'makePreviewUrl' };
              }
            }),
            'updateEmbedCopy',
            send('PREVIEW'),
          ],
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
        PREVIEW: [
          {
            cond: (ctx) => ctx.loaded,
            target: '.updating',
            internal: false,
          },
          '.loading',
        ],
        IFRAME_READY: {
          actions: [
            embedPreviewModel.assign({
              iframe: (_, e) => e.iframe,
            }),
          ],
        },
      },
      states: {
        idle: {},
        updating: {
          meta: {
            description:
              'Once iframe is loaded, we no longer change its `src` because that reloads the iframe window. Instead, we send the new url to its window using `postMessage`. That message will be picked up by `window.onmessage` listener that uses NextJS `router.pushState`',
          },
          entry: (ctx) => {
            ctx.iframe?.contentWindow?.postMessage(
              {
                type: 'EMBED_PARAMS_CHANGED',
                url: ctx.embedUrl.replace('/viz', ''),
              },
              '*',
            );
          },
        },
        loading: {
          tags: 'preview_loading',
          on: {
            IFRAME_LOADED: 'loaded',
            IFRAME_ERROR: 'error',
          },
        },
        loaded: {
          entry: embedPreviewModel.assign({ loaded: true }),
        },
        error: {
          tags: 'preview_error',
          on: {
            RETRY: 'loading',
          },
        },
      },
    },
  },
});

const useEmbedCodeClipboard = () => {
  const [value, setValue] = useState('');
  const { onCopy, hasCopied } = useClipboard(value);

  return {
    copy: onCopy,
    setCopyText: setValue,
    isCopied: hasCopied,
  };
};

const EmbedPreviewContent: React.FC = () => {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null!);
  const {
    copy: copyEmbedCode,
    isCopied,
    setCopyText,
  } = useEmbedCodeClipboard();
  const iframe = useRef<HTMLIFrameElement>(null!);
  const [previewState, sendPreviewEvent] = useMachine(embedPreviewMachine, {
    actions: {
      saveParams: assign({
        params: (_, e) => {
          return (e as any).params;
        },
      }),
      updateEmbedCopy: (ctx) => {
        setCopyText(ctx.embedCode);
      },
      makeEmbedUrlAndCode: assign((ctx) => {
        const url = makeEmbedUrl(
          router.query.sourceFileId as string,
          window.location.origin,
          ctx.params,
        );

        return {
          embedUrl: url,
          embedCode: getEmbedCodeFromUrl(url),
          params: ctx.params,
        };
      }),
      makePreviewUrl: assign((ctx) => {
        const url = makeEmbedUrl(
          router.query.sourceFileId as string,
          window.location.origin,
          ctx.params,
        );
        return {
          previewUrl: url,
        };
      }),
    },
  });

  useEffect(() => {
    // On mount, signal that iframe ref is ready
    sendPreviewEvent({ type: 'IFRAME_READY', iframe: iframe.current });

    const formRef = form.current;
    // Reset the form when leaving the embed preview (unmount)
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
      gridTemplateColumns="20rem 1fr"
      data-testid="embed-preview"
    >
      <Box
        gridArea="sidebar"
        borderRight="1px dotted var(--chakra-colors-black)"
        paddingRight="2"
        opacity={!isFormReady ? 0.5 : 1}
        cursor={!isFormReady ? 'not-allowed' : 'default'}
        disabled={!isFormReady}
      >
        <VStack spacing="10" justifyContent="space-between" height="100%">
          <form
            style={{ width: '100%' }}
            onChange={() => {
              sendPreviewEvent({
                type: 'PARAMS_CHANGED',
                params: {
                  ...DEFAULT_EMBED_PARAMS,
                  ...extractFormData(form.current),
                },
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
                <Select
                  defaultValue={previewState.context.params.mode}
                  id="mode"
                  name="mode"
                  size="sm"
                  width="auto"
                >
                  {Object.values(EmbedMode).map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {previewState.context.params.mode !== EmbedMode.Viz && (
                <>
                  <FormControl
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <FormLabel
                      marginBottom="0"
                      htmlFor="panel"
                      whiteSpace="nowrap"
                    >
                      Active Panel
                    </FormLabel>
                    <Select
                      defaultValue={previewState.context.params.panel}
                      id="panel"
                      name="panel"
                      size="sm"
                      width="auto"
                    >
                      {Object.values(EmbedPanel)
                        .filter((panel) => panel !== EmbedPanel.Settings)
                        .map((panel) => (
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
                    <Switch
                      defaultChecked={previewState.context.params.readOnly}
                      id="readOnly"
                      name="readOnly"
                    />
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
                      defaultChecked={
                        previewState.context.params.showOriginalLink
                      }
                      id="showOriginalLink"
                      name="showOriginalLink"
                    />
                  </FormControl>
                </>
              )}

              {previewState.context.params.mode !== EmbedMode.Panels && (
                <>
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
                    <Switch
                      defaultChecked={previewState.context.params.controls}
                      id="controls"
                      name="controls"
                    />
                  </FormControl>

                  {previewState.context.params.controls && (
                    <>
                      <FormControl
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <FormLabel
                          marginBottom="0"
                          htmlFor="pan"
                          whiteSpace="nowrap"
                        >
                          Allow panning
                        </FormLabel>
                        <Switch
                          defaultChecked={previewState.context.params.pan}
                          id="pan"
                          name="pan"
                        />
                      </FormControl>

                      <FormControl
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <FormLabel
                          marginBottom="0"
                          htmlFor="zoom"
                          whiteSpace="nowrap"
                        >
                          Allow zooming
                        </FormLabel>
                        <Switch
                          defaultChecked={previewState.context.params.zoom}
                          id="zoom"
                          name="zoom"
                        />
                      </FormControl>
                    </>
                  )}
                </>
              )}
            </VStack>
          </form>
          <Box position="relative" width="100%">
            <Button
              size="xs"
              position="absolute"
              rounded="none"
              top="0"
              right="0"
              transform="translateY(-110%)"
              onClick={copyEmbedCode}
            >
              {isCopied ? 'Copied' : 'Copy'}
            </Button>
            <Textarea
              minHeight="200px"
              readOnly
              value={previewState.context.embedCode}
              onClick={(e) => {
                (e.target as HTMLTextAreaElement).select();
                copyEmbedCode();
              }}
            />
          </Box>
        </VStack>
      </Box>
      <Box
        gridArea="preview"
        paddingLeft="2"
        display="flex"
        placeContent="center"
      >
        {isPreviewLoading && (
          <Overlay>
            <Spinner size="lg" />
          </Overlay>
        )}
        {isPreviewError && (
          <VStack justifyContent="center">
            <Center color="red.500">Error loading preview</Center>
            <Button
              onClick={() => {
                sendPreviewEvent('RETRY');
              }}
            >
              Retry
            </Button>
          </VStack>
        )}
        {!isPreviewError && (
          <Box position="relative" width="100%" height="0" paddingTop="56.25%">
            <iframe
              ref={iframe}
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
              src={previewState.context.previewUrl}
            ></iframe>
          </Box>
        )}
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
