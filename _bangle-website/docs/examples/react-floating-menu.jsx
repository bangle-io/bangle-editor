import '@banglejs/core/style.css';
import '@banglejs/tooltip/style.css';
import '@banglejs/react-menu/style.css';
import BrowserOnly from '@docusaurus/BrowserOnly';
import React, { useEffect, useRef, useState } from 'react';
import { ReactEditor } from '@banglejs/react';
import { PluginKey } from '@banglejs/core';
import { SpecRegistry } from '@banglejs/core/spec-registry';
import { corePlugins } from '@banglejs/core/utils/core-components';
import { floatingMenu, FloatingMenu } from '@banglejs/react-menu';

const menuKey = new PluginKey('menuKey');

export default function Editor() {
  const editorRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const specRegistry = new SpecRegistry();
    const plugins = [
      ...corePlugins(),
      floatingMenu.plugins({
        key: menuKey,
      }),
    ];
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
            content: 'Try selection me.',
          },
        }}
      >
        <FloatingMenu menuKey={menuKey} />
      </ReactEditor>
    )
  );
}
