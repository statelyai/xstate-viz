module.exports = {
  reactScriptsVersion: 'react-scripts',
  plugins: [
    {
      plugin: {
        overrideWebpackConfig: ({ webpackConfig }) => {
          const oneOfRule = webpackConfig.module.rules[1];
          if (!('oneOf' in oneOfRule)) {
            throw new Error(
              'Structure of the webpack config has changed. The `oneOf` rule was expected as the second rule.',
            );
          }

          // CRA transpiles node_modules by default, so `class Realm` becomes `createClass(Realm, [/* */])`
          // where `createClass` is a so-called "Babel helper"
          // for some reason that createClass was dropped (or not included) in production builds
          // it's most likely a bug somewhere in the build tooling - maybe in the minification process in Terser
          // we don't need to transpile `node_modules` though as we only support modern browsers
          // so we should be mostly OK if we just drop the webpack rule responsible for transpiling them
          for (var i = 0; i < oneOfRule.oneOf.length; i++) {
            const rule = oneOfRule.oneOf[i];

            if (!rule.loader.includes('babel-loader')) {
              continue;
            }

            const { presets } = rule.options;

            if (presets[0][0].includes('babel-preset-react-app/dependencies')) {
              oneOfRule.oneOf.splice(i, 1);
              return webpackConfig;
            }
          }

          throw new Error('Expected to find a Babel rule for `node_modules`.');
        },
      },
    },
  ],
};
