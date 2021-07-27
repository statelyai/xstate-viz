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
    queryXStateIdentifiers() {
      throw new Error('Not implemented yet.');
    }
  };
};
