const loadScript = (src: string) => {
  return new Promise<void>((resolve, reject) => {
    const scriptElement = document.createElement('script');
    scriptElement.src = src;

    const timeout = setTimeout(() => {
      reject('Timeout');
    }, 15000);

    scriptElement.onload = () => {
      resolve();
      clearTimeout(timeout);
    };
    document.body.appendChild(scriptElement);
  });
};

declare global {
  export const prettier: typeof import('prettier');
  export const prettierPlugins: (string | import('prettier').Plugin)[];

  interface Window {
    define: any;
  }
}

const Prettier = () => {
  let hasLoaded = false;

  const loadPrettier = async () => {
    if (hasLoaded) return;

    /**
     * Helps Monaco editor get over a too-sensitive error
     *
     * https://stackoverflow.com/questions/55057425/can-only-have-one-anonymous-define-call-per-script-file
     */
    const define = window.define;
    window.define = () => {};

    await Promise.all([
      loadScript('https://unpkg.com/prettier@2.3.2/standalone.js'),
      loadScript('https://unpkg.com/prettier@2.3.2/parser-typescript.js'),
    ]);

    window.define = define;

    hasLoaded = true;
  };

  const format = async (code: string) => {
    try {
      await loadPrettier();
      return prettier.format(code, {
        parser: 'typescript',
        plugins: prettierPlugins,
      });
    } catch (e) {
      console.error(e);
    }
    /**
     * If loading prettier fails, just
     * load the code
     */
    return code;
  };

  return {
    format,
  };
};

export const prettierLoader = Prettier();
