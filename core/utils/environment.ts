let nodeEnv = undefined;

// Done this way to allow for bundlers
// to do a string replace.
try {
  // @ts-ignore
  // eslint-disable-next-line no-process-env
  nodeEnv = process.env.NODE_ENV;
} catch (err) {}

export const APP_ENV: string | undefined = nodeEnv;

export const isProdEnv = nodeEnv === 'production';
export const isTestEnv = nodeEnv === 'test';
