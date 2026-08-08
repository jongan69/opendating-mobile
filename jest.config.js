/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // opendating-protocol and @noble ship ESM-only `exports` maps with no
    // `require` condition, which Jest's CJS resolver cannot satisfy. Point
    // directly at the files and let the transform below downlevel them.
    '^opendating-protocol$': '<rootDir>/node_modules/opendating-protocol/dist/index.js',
    '^opendating-protocol/(.*)$': '<rootDir>/node_modules/opendating-protocol/dist/$1',
  },
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
  },
  transformIgnorePatterns: ['/node_modules/(?!(opendating-protocol|@noble)/)'],
  testPathIgnorePatterns: ['/node_modules/', '/.expo/'],
  testMatch: ['**/__tests__/**/*.test.ts'],
};
