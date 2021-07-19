// This file exists to configure and patch the Monaco editor
import monacoLoader from '@monaco-editor/loader';

// this makes debugging in development easier (with non-minified version of the Monaco)
monacoLoader.config({
  paths: {
    // use the version that @monaco-editor/loader defaults to
    vs: `https://unpkg.com/monaco-editor@0.25.2/${
      process.env.NODE_ENV === 'development' ? 'dev' : 'min'
    }/vs`,
  },
});

function toTextEdit(provider: any, textChange: any) {
  return {
    text: textChange.newText,
    range: (provider as any)._textSpanToRange(
      provider.__model,
      textChange.span,
    ),
  };
}

const initLoader = monacoLoader.init;
monacoLoader.init = function (...args) {
  const cancelable = initLoader.apply(this, ...args);

  cancelable.then(
    (monaco) => {
      const { registerCompletionItemProvider } = monaco.languages;

      monaco.languages.registerCompletionItemProvider = function (
        language,
        provider,
      ) {
        if (language !== 'typescript') {
          return registerCompletionItemProvider(language, provider);
        }

        // those are mostly copied from https://github.com/microsoft/monaco-typescript/blob/17582eaec0872b9a311ec0dee2853e4fc6ba6cf2/src/languageFeatures.ts#L434
        // it has some minor adjustments (& hacks) to enable auto-imports
        provider.provideCompletionItems = async function (
          model,
          position,
          _context,
          token,
        ) {
          (this as any).__model = model;

          const wordInfo = model.getWordUntilPosition(position);
          const wordRange = new monaco.Range(
            position.lineNumber,
            wordInfo.startColumn,
            position.lineNumber,
            wordInfo.endColumn,
          );
          const resource = model.uri;
          const offset = model.getOffsetAt(position);

          const worker = await (this as any)._worker(resource);

          if (model.isDisposed()) {
            return;
          }

          const info = await worker.getCompletionsAtPosition(
            resource.toString(),
            offset,
          );

          if (!info || model.isDisposed()) {
            return;
          }

          const suggestions = info.entries.map((entry: any) => {
            let range = wordRange;
            if (entry.replacementSpan) {
              const p1 = model.getPositionAt(entry.replacementSpan.start);
              const p2 = model.getPositionAt(
                entry.replacementSpan.start + entry.replacementSpan.length,
              );

              range = new monaco.Range(
                p1.lineNumber,
                p1.column,
                p2.lineNumber,
                p2.column,
              );
            }

            const tags = [];
            if (entry.kindModifiers?.indexOf('deprecated') !== -1) {
              tags.push(monaco.languages.CompletionItemTag.Deprecated);
            }

            return {
              uri: resource,
              position: position,
              offset: offset,
              range: range,
              label: entry.name,
              insertText: entry.name,
              sortText: entry.sortText,
              kind: (provider.constructor as any).convertKind(entry.kind),
              tags,
              // properties below were added here
              data: entry.data,
              source: entry.source,
              hasAction: entry.hasAction,
            };
          });

          return {
            suggestions,
          };
        };

        provider.resolveCompletionItem = function (
          item: any /*, token which stays unused */,
        ) {
          return (this as any)
            ._worker(item.uri)
            .then((worker: any) => {
              return worker.getCompletionEntryDetails(
                (item as any).uri.toString(),
                item.offset,
                item.label,
                /* formatOptions */ {},
                (item as any).uri.toString(), // this could potentially be `item.source`, according to some API docs, didn't have time to test this out yet
                /* userPreferences */ undefined,
                item.data,
              );
            })
            .then((details: any) => {
              if (!details) {
                return item;
              }

              const codeAction = details.codeActions?.[0];
              const additionalTextChange =
                codeAction?.changes[0].textChanges[0];

              // assume that if the codeAction is there it's about auto import
              // and since the only external "module" that is supported is xstate we can just use it literally here
              const detailText = codeAction
                ? `Auto import from 'xstate'`
                : details.displayParts
                    ?.map((displayPart: any) => displayPart.text)
                    .join('') ?? '';

              return {
                uri: item.uri,
                position: item.position,
                label: details.name,
                kind: (provider.constructor as any).convertKind(details.kind),
                detail: detailText,

                // properties below were added here
                // ---
                // this could be flatMaped with all text edit
                // but we don't rly have a use case for multiple additional text edits at the same time
                additionalTextEdits: additionalTextChange && [
                  toTextEdit(provider, additionalTextChange),
                ],
                documentation: {
                  value: (provider.constructor as any).createDocumentationString(
                    details,
                  ),
                },
              };
            });
        };

        return registerCompletionItemProvider(language, provider);
      };
    },
    () => {},
  );

  return cancelable;
};
