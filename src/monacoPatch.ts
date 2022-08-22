// This file exists to configure and patch the Monaco editor
import monacoLoader from '@monaco-editor/loader';
import type { languages } from 'monaco-editor';

// should be in sync with the "modules" allowed by our eval Function
import * as XState from 'xstate';
import * as XStateModel from 'xstate/lib/model';
import * as XStateActions from 'xstate/lib/actions';

// dont hate the player, hate the game
// https://github.com/microsoft/vscode-loader/issues/33
if (typeof document !== 'undefined') {
  const { insertBefore } = document.head;
  document.head.insertBefore = function (
    newChild: Node,
    refChild: Node | null,
  ): any {
    // @ts-ignore
    const self: HTMLHeadElement = this;

    if (newChild.nodeType !== Node.ELEMENT_NODE) {
      return insertBefore.call(self, newChild, refChild);
    }

    const newElement = newChild as Element;

    if (
      newElement.tagName === 'LINK' &&
      (newElement as HTMLLinkElement).href.includes('/editor/')
    ) {
      return self.appendChild(newElement);
    }

    return insertBefore.call(self, newChild, refChild);
  } as any;
}

const MONACO_LOCATION =
  process.env.NODE_ENV === 'development' ||
  Boolean(process.env.NEXT_PUBLIC_USE_LOCAL_MONACO)
    ? // this makes debugging in development easier
      // (with non-minified version of the Monaco)
      // and ensures Cypress caches the result on disk
      `/viz/monaco-editor/dev/vs`
    : // use the version that @monaco-editor/loader defaults to
      `https://unpkg.com/monaco-editor@0.25.2/min/vs`;

monacoLoader.config({
  paths: {
    vs: MONACO_LOCATION,
  },
});

const fixupXStateSpecifier = (specifier: string) =>
  specifier
    .replace(/\.\/node_modules\//, '')
    // redirect 'xstate/lib' to 'xstate'
    .replace(/xstate\/lib(?!\/)/, 'xstate');

function toTextEdit(provider: any, textChange: any): languages.TextEdit {
  return {
    // if there is no existing xstate import in the file then a new import has to be created
    // in such a situation TS most likely fails to compute the proper module specifier for this "node module"
    // because it exits its `tryGetModuleNameAsNodeModule` when it doesn't have fs layer installed:
    // https://github.com/microsoft/TypeScript/blob/328e888a9d0a11952f4ff949848d4336bce91b18/src/compiler/moduleSpecifiers.ts#L553
    // it then generates a relative path which we just patch here
    text: fixupXStateSpecifier(textChange.newText),
    range: (provider as any)._textSpanToRange(
      provider.__model,
      textChange.span,
    ),
  };
}

type AutoImport = { detailText: string; textEdits: languages.TextEdit[] };

function getAutoImport(provider: any, details: any): AutoImport | undefined {
  const codeAction = details.codeActions?.[0];

  if (!codeAction) {
    return;
  }

  const { textChanges } = codeAction.changes[0];

  if (
    textChanges.every((textChange: any) => !/import/.test(textChange.newText))
  ) {
    // if the new text doesn't start with an import it means that it's going to be added to the existing import
    // it can be safely (for the most part) accepted as is

    // example description:
    // Add 'createMachine' to existing import declaration from "xstate"
    const specifier = codeAction.description.match(/from ["'](.+)["']/)![1];
    return {
      detailText: `Auto import from '${specifier}'`,
      textEdits: textChanges.map((textChange: any) =>
        toTextEdit(provider, textChange),
      ),
    };
  }

  if (details.kind === 'interface' || details.kind === 'type') {
    const specifier = codeAction.description.match(
      /from module ["'](.+)["']/,
    )![1];
    return {
      detailText: `Auto import from '${fixupXStateSpecifier(specifier)}'`,
      textEdits: textChanges.map((textChange: any) =>
        toTextEdit(provider, {
          ...textChange,
          // make type-related **new** imports safe
          // the resolved specifier might be internal
          // we don't have an easy way to remap it to a more public one that we actually allow when we load the code at runtime
          //
          // this kind should work out of the box with `isolatedModules: true` but for some reason it didn't when I've tried it
          newText: textChange.newText.replace(/import/, 'import type'),
        }),
      ),
    };
  }

  let specifier = '';

  // fortunately auto-imports are not suggested for types
  if (details.name in XState) {
    specifier = 'xstate';
  } else if (details.name in XStateModel) {
    specifier = 'xstate/lib/model';
  } else if (details.name in XStateActions) {
    specifier = 'xstate/lib/actions';
  }

  if (!specifier) {
    return;
  }

  return {
    detailText: `Auto import from '${specifier}'`,
    textEdits: textChanges.map((textChange: any) =>
      toTextEdit(provider, textChange),
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

          const suggestions = info.entries
            .filter((entry: any) => {
              // Here we filter any entry that exists in XState but is not imported from the core library
              if (
                entry.name in XState &&
                entry.source !== 'file:///node_modules/xstate/lib/index'
              ) {
                return false;
              }
              return true;
            })
            .map((entry: any) => {
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

              const autoImport = getAutoImport(provider, details);

              return {
                uri: item.uri,
                position: item.position,
                label: details.name,
                kind: (provider.constructor as any).convertKind(details.kind),
                detail:
                  autoImport?.detailText ||
                  (details.displayParts
                    ?.map((displayPart: any) => displayPart.text)
                    .join('') ??
                    ''),

                // properties below were added here
                additionalTextEdits: autoImport?.textEdits,
                documentation: {
                  value: (
                    provider.constructor as any
                  ).createDocumentationString(details),
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
