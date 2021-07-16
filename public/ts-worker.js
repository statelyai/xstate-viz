// eslint-disable-next-line no-restricted-globals
self.customTSWorkerFactory = (TypeScriptWorker) => {
  return class extends TypeScriptWorker {
    getCompletionsAtPosition(fileName, position, options) {
      return this._languageService.getCompletionsAtPosition(
        fileName,
        position,
        {
          ...options,
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
