// eslint-disable-next-line no-restricted-globals
self.customTSWorkerFactory = (TypeScriptWorker) => {
  // for now it's just a showcase how we can customize this class
  return class extends TypeScriptWorker {
    getEmitOutput(...args) {
      return super.getEmitOutput(...args);
    }
    queryXStateIdentifiers() {
      throw new Error('Not implemented yet.');
    }
  };
};
