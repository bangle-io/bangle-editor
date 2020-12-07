import React from 'react';
import { useRef, useEffect, useState } from 'react';
import { ReactEditor } from '@banglejs/react';
import { SpecRegistry } from '@banglejs/core/spec-registry';
import { corePlugins } from '@banglejs/core/utils/core-components';
import '@banglejs/core/style.css';

export default function Editor() {
  const editorRef = useRef(null);
  const [, setReady] = useState(false);

  useEffect(() => {
    const specRegistry = new SpecRegistry();
    const plugins = corePlugins();
    editorRef.current = {
      specRegistry,
      plugins,
    };
    setReady(true);
  }, [editorRef]);

  return (
    editorRef.current && (
      <ReactEditor
        options={{
          ...editorRef.current,
          stateOpts: {
            content: 'Hello world',
          },
        }}
      />
    )
  );
}
