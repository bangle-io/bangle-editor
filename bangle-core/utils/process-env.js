export function isTestEnv() {
  return process.env.NODE_ENV === 'test';
}

export function isJestIntegration() {
  return isTestEnv() && process.env.JEST_INTEGRATION;
}
