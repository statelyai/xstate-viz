// it's based on https://github.com/vercel/next.js/blob/d8093ec4b4555f32417f7f2148683930fab7d934/examples/with-jest/jest.config.js

module.exports = {
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  // it's adjusted default pattern because we need to ignore Cypress tests
  // https://jestjs.io/docs/configuration#testmatch-arraystring
  testMatch: ['<rootDir>/src/**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: ['/node_modules/'],
};
