import '@banglejs/core/style.css';

import React from 'react';
import { ReactEditor } from '@banglejs/react';
import { SpecRegistry } from '@banglejs/core/spec-registry';
import { corePlugins } from '@banglejs/core/utils/core-components';

const specRegistry = new SpecRegistry();
const plugins = corePlugins();

export default function Editor() {
  return (
    <ReactEditor
      options={{
        specRegistry,
        plugins,
        stateOpts: {
          content: 'Hello world',
        },
      }}
    />
  );
}
