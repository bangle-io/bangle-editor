import './style.css';

import { inspect } from '@xstate/inspect';
import React, { useCallback, useEffect, useState } from 'react';
import reactDOM from 'react-dom';

import { defaultPlugins, defaultSpecs } from '@bangle.dev/all-base-components';
import { collabClient } from '@bangle.dev/collab-client';
import { CollabMessageBus } from '@bangle.dev/collab-comms';
import { CollabManager, CollabServerState } from '@bangle.dev/collab-manager';
import {
  BangleEditor as CoreBangleEditor,
  RawPlugins,
  SpecRegistry,
} from '@bangle.dev/core';
import { Node } from '@bangle.dev/pm';
import { BangleEditor, useEditorState } from '@bangle.dev/react';
import { Emitter } from '@bangle.dev/utils';

import { win } from '../../setup/entry-helpers';
import {
  baseTestConfig,
  EDITOR_1,
  EDITOR_2,
  EDITOR_3,
  EDITOR_4,
  EditorInfo,
  EditorInfos,
  TestConfig,
} from './common';

const rawDoc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'hello world!',
        },
      ],
    },
  ],
};

inspect({
  // options
  // url: 'https://stately.ai/viz?inspect', // (default)
  iframe: false, // open in new window
});

export default function setup() {
  document.body.className = 'collab-editor-body';
  let wrapper = document.createElement('div');
  wrapper.setAttribute('class', 'wrapper');

  document.body.appendChild(wrapper);

  win.loadCollabComponent = () => {
    reactDOM.render(
      <Main testConfig={Object.assign({}, baseTestConfig, win.testConfig)} />,
      wrapper,
    );
    return () => {
      reactDOM.unmountComponentAtNode(wrapper);
    };
  };

  // setTimeout(() => {
  //   win.loadCollabComponent();
  // }, 20);
}

function Main({ testConfig }: { testConfig: TestConfig }) {
  console.info('testConfig', testConfig);
  const [data] = useState(() => {
    const specRegistry = new SpecRegistry(defaultSpecs());

    const collabMessageBus = new CollabMessageBus({
      debugSlowdown: testConfig.collabSlowdown,
    });

    const editorManager = new CollabManager({
      schema: specRegistry.schema,
      collabMessageBus: collabMessageBus,
      async getInitialState() {
        return new CollabServerState(
          specRegistry.schema.nodeFromJSON(rawDoc) as Node,
        );
      },
      applyState: (docName, newCollab, oldCollab) => {
        return true;
      },
    });

    (window as any).editorManager = editorManager;
    return {
      editorManager,
      specRegistry,
      collabMessageBus,
    };
  });

  const [editors, updateEditors] = useState(() => {
    const editors: EditorInfos = {
      [EDITOR_1]: {
        mount: testConfig.initialEditors.includes(EDITOR_1),
        id: EDITOR_1,
        rejectRequests: false,
      },
      [EDITOR_2]: {
        mount: testConfig.initialEditors.includes(EDITOR_2),
        id: EDITOR_2,
        rejectRequests: false,
      },
      [EDITOR_3]: {
        mount: testConfig.initialEditors.includes(EDITOR_3),
        id: EDITOR_3,
        rejectRequests: false,
      },
      [EDITOR_4]: {
        mount: testConfig.initialEditors.includes(EDITOR_4),
        id: EDITOR_4,
        rejectRequests: false,
      },
    };
    return editors;
  });

  useEffect(() => {
    win.collabEditors = editors;
    win.manager = data.editorManager;
    win.specRegistry = data.specRegistry;
    win.collabMessageBus = data.collabMessageBus;
  }, [editors, data]);

  useEffect(() => {
    return () => {
      // data.editorManager
    };
  }, [data]);

  const onEditorReady = useCallback(
    (id: keyof EditorInfos, editor: CoreBangleEditor) => {
      updateEditors((editors) => {
        const newEditors = { ...editors };
        newEditors[id].bangleEditor = editor;
        return newEditors;
      });
    },
    [],
  );

  return (
    <>
      {Object.values(editors).map((obj: EditorInfo) =>
        obj.mount ? (
          <EditorWrapper
            key={obj.id}
            id={obj.id}
            rejectRequests={(id, reject) => {
              updateEditors((editors) => {
                const newEditors = { ...editors };
                newEditors[id].rejectRequests = reject;
                return newEditors;
              });
            }}
            onClose={(id) => {
              updateEditors((editors) => {
                const newEditors = { ...editors };
                editors[id].mount = false;
                editors[id].bangleEditor = undefined;
                return newEditors;
              });
            }}
            onEditorReady={onEditorReady}
            specRegistry={data.specRegistry}
            editorInfo={obj}
            plugins={() => [
              ...defaultPlugins(),
              collabPlugin(
                data.editorManager,
                obj.id,
                testConfig,
                data.collabMessageBus,
              ),
            ]}
          />
        ) : (
          <div key={obj.id}>
            <button
              aria-label={`mount ${obj.id}`}
              onClick={() => {
                updateEditors((editors) => {
                  const newEditors = { ...editors };
                  newEditors[obj.id].mount = true;
                  return newEditors;
                });
              }}
            >
              Mount {obj.id}
            </button>
          </div>
        ),
      )}
    </>
  );
}

function EditorWrapper({
  specRegistry,
  plugins,
  id,
  onEditorReady,
  onClose,
  rejectRequests,
  editorInfo,
}: {
  editorInfo: EditorInfo;
  plugins: RawPlugins;
  specRegistry: SpecRegistry;
  onEditorReady: (id: keyof EditorInfos, editor: CoreBangleEditor) => void;
  id: keyof EditorInfos;
  onClose: (id: keyof EditorInfos) => void;
  rejectRequests: (id: keyof EditorInfos, reject: boolean) => void;
}) {
  const win: any = window;
  const _onEditorReady = useCallback(
    (_editor: any) => {
      onEditorReady(id, _editor);
    },
    [id, onEditorReady],
  );

  win.dispatcher = (command: any) => {
    // return command(
    //   win.editor.view.state,
    //   win.editor.view.dispatch,
    //   win.editor.view,
    // );
  };

  const editorState = useEditorState({ specRegistry, plugins });

  return (
    <div
      id={id}
      style={{
        backgroundColor: '#fafafa',
        height: '100%',
        overflowY: 'scroll',
      }}
    >
      <div
        style={{
          backgroundColor: 'plum',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <span>{id}</span>
        <button
          aria-label={`close ${id}`}
          onClick={() => {
            onClose(id);
          }}
        >
          Close
        </button>
        <button
          aria-label={`reject requests ${id}`}
          onClick={() => {
            rejectRequests(id, !Boolean(editorInfo.rejectRequests));
          }}
        >
          Reject requests
        </button>
      </div>
      <div>
        <BangleEditor
          className="collab-editor-wrapper"
          state={editorState}
          onReady={_onEditorReady}
        />
      </div>
    </div>
  );
}

function collabPlugin(
  editorManager: CollabManager,
  clientID: keyof EditorInfos,
  testConfig: TestConfig,
  collabMessageBus: CollabMessageBus,
) {
  return collabClient.plugins({
    docName: 'test-doc',
    clientID,
    collabMessageBus,
    managerId: editorManager.managerId,
  });
}
