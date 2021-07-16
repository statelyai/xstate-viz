// eslint-disable-next-line no-restricted-globals
self.customTSWorkerFactory = (TypeScriptWorker) => {
  return class extends TypeScriptWorker {
    getCompletionsAtPosition(fileName, position, options) {
      const ret = this._languageService.getCompletionsAtPosition(
        fileName,
        position,
        {
          ...options,
          includeCompletionsForModuleExports: true,
          // includeCompletionsWithInsertText,
        },
      );
      console.log(ret.entries.find((a) => a.name === 'assign'));
      return ret;
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
      console.log('getCompletionEntryDetails args', {
        fileName,
        position,
        entryName,
        formatOptions,
        source,
        preferences,
        data,
      });
      const ret = this._languageService.getCompletionEntryDetails(
        fileName,
        position,
        entryName,
        formatOptions,
        source,
        preferences,
        data,
      );
      console.log('getCompletionEntryDetails return', ret);
      return ret;
    }
    queryXStateIdentifiers() {
      throw new Error('Not implemented yet.');
    }
  };
};
