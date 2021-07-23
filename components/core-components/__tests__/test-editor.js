import { renderTestEditor } from '@bangle.dev/test-helpers';
import { SpecRegistry } from '@bangle.dev/core';
import { defaultPlugins, defaultSpecs } from './default-components';

export const defaultTestEditor = ({ specRegistry, plugins } = {}) => {
  if (!(specRegistry instanceof SpecRegistry)) {
    specRegistry = new SpecRegistry(defaultSpecs(specRegistry));
  }

  if (!plugins || !Array.isArray(plugins)) {
    plugins = defaultPlugins(plugins);
  }

  return renderTestEditor({
    specRegistry,
    plugins,
  });
};
