const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Path aliases are not currently used in the codebase, but this mapping is retained
  // in case we reintroduce them in the future for cleaner imports.
  moduleNameMapper: {
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@scripts/(.*)$': '<rootDir>/scripts/$1',
    '^@libs/(.*)$': '<rootDir>/services/libs/$1',
    '^@shared/(.*)$': '<rootDir>/services/shared/$1',
  },
  transform: {
    ...tsJestTransformCfg,
  },
};