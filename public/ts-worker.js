// codes taken from the TS codebase, this ts-worker is not bundled right now so we can't easily use any module system here to import these
// https://github.com/microsoft/TypeScript/blob/1aac3555f7ebbfc10515d2ba28f041e03e75d885/src/compiler/diagnosticMessages.json#L1457-L1460
const CANNOT_FIND_NAME_CODE = 2304;
// https://github.com/microsoft/TypeScript/blob/1aac3555f7ebbfc10515d2ba28f041e03e75d885/src/compiler/diagnosticMessages.json#L2409-L2412
const CANNOT_FIND_NAME_DID_YOU_MEAN_CODE = 2552;
// https://github.com/microsoft/TypeScript/blob/1aac3555f7ebbfc10515d2ba28f041e03e75d885/src/compiler/diagnosticMessages.json#L7110-L7113
const NO_VALUE_EXISTS_IN_SCOPE_FOR_THE_SHORTHAND_PROPERTY_CODE = 18004;

const uniq = (arr) => Array.from(new Set(arr));

// eslint-disable-next-line no-restricted-globals
self.customTSWorkerFactory = (TypeScriptWorker) => {
  return class extends TypeScriptWorker {
    getCompletionsAtPosition(fileName, position, options) {
      return this._languageService.getCompletionsAtPosition(
        fileName,
        position,
        {
          ...options,
          // enable auto-imports to be included in the completion list
          // https://github.com/microsoft/TypeScript/blob/1e2c77e728a601b92f18a7823412466fea1be913/lib/protocol.d.ts#L2619-L2623
          includeCompletionsForModuleExports: true,
        },
      );
    }
    getCompletionEntryDetails(
      fileName,
      position,
      entryName,
      formatOptions,
      source,
      preferences,
      data,
    ) {
      return this._languageService.getCompletionEntryDetails(
        fileName,
        position,
        entryName,
        formatOptions,
        source,
        preferences,
        data,
      );
    }
    // lists what has been used from the list of things initially exposed here:
    // https://github.com/statecharts/xstate-viz/blob/87e87c8610ed84d5d61975c8451be7aba21ca18a/src/StateChart.tsx#L143-L151
    queryXStateGistIdentifiers(fileName) {
      const exposedToGists = new Set([
        'Machine',
        'interpret',
        'assign',
        'send',
        'sendParent',
        'spawn',
        'raise',
        'actions',
        'XState',
      ]);
      const program = this._languageService.getProgram();
      const sourceFile = program.getSourceFile(fileName);
      const diagnostics = program.getSemanticDiagnostics(sourceFile);

      return uniq(
        diagnostics
          .filter((diagnostic) => {
            switch (diagnostic.code) {
              case CANNOT_FIND_NAME_CODE:
              case CANNOT_FIND_NAME_DID_YOU_MEAN_CODE:
              case NO_VALUE_EXISTS_IN_SCOPE_FOR_THE_SHORTHAND_PROPERTY_CODE:
                return true;
              default:
                return false;
            }
          })
          // the missing name is always quoted in the message text and it's the first quoted thing for all the filtered codes
          .map((diagnostic) => diagnostic.messageText.match(/["'](.+?)["']/)[1])
          .filter((name) => exposedToGists.has(name)),
      );
    }
  };
};
