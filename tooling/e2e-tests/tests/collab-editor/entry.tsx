import './style.css';

import React, { useCallback, useEffect, useState } from 'react';
import reactDOM from 'react-dom';

import { defaultPlugins, defaultSpecs } from '@bangle.dev/all-base-components';
import { collabClient } from '@bangle.dev/collab-client';
import type { CollabRequestType } from '@bangle.dev/collab-server';
import {
  CollabError,
  Manager,
  parseCollabResponse,
} from '@bangle.dev/collab-server';
import {
  BangleEditor as CoreBangleEditor,
  RawPlugins,
  SpecRegistry,
} from '@bangle.dev/core';
import { Node } from '@bangle.dev/pm';
import { BangleEditor, useEditorState } from '@bangle.dev/react';

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

class SimpleDisk {
  constructor(public specRegistry: SpecRegistry) {}

  async flush(_key: string, _doc: Node, version: number) {}
  async load(_key: string): Promise<Node> {
    return this.specRegistry.schema.nodeFromJSON(rawDoc) as Node;
  }

  async update(
    _key: string,
    _getLatestDoc: () => { doc: Node; version: number },
  ) {}
}

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
}

function Main({ testConfig }: { testConfig: TestConfig }) {
  console.info('testConfig', testConfig);
  const [data] = useState(() => {
    const specRegistry = new SpecRegistry(defaultSpecs());
    const disk = new SimpleDisk(specRegistry);

    const editorManager = new Manager(specRegistry.schema, {
      disk,
      collectUsersTimeout: 400,
      userWaitTimeout: 400,
      instanceCleanupTimeout: 700,
    });
    return {
      editorManager,
      specRegistry,
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
  }, [editors, data]);

  useEffect(() => {
    return () => {
      data.editorManager.destroy();
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
              collabPlugin(data.editorManager, obj.id, obj, testConfig),
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
  editorManager: Manager,
  clientID: keyof EditorInfos,
  editorInfo: EditorInfo,
  testConfig: TestConfig,
) {
  // TODO fix types of collab plugin
  const sendRequest = (type: CollabRequestType, payload: any): any => {
    console.log(clientID, editorInfo.rejectRequests);
    if (editorInfo.rejectRequests) {
      return Promise.reject(
        new CollabError(testConfig.collabErrorCode, 'Unknown error'),
      );
    }
    return editorManager.handleRequest(type, payload).then((obj) => {
      return parseCollabResponse(obj);
    });
  };

  return collabClient.plugins({
    docName: 'test-doc',
    clientID,
    async getDocument({ docName, userId }) {
      return sendRequest('get_document', {
        docName,
        userId,
      });
    },

    async pullEvents({ version, docName, userId, managerId }) {
      return sendRequest('pull_events', {
        docName,
        version,
        userId,
        managerId,
      });
    },

    async pushEvents({ version, steps, clientID, docName, userId, managerId }) {
      return sendRequest('push_events', {
        clientID,
        version,
        steps,
        docName,
        userId,
        managerId,
      });
    },
    onFatalError(error) {
      if (error.errorCode >= 500) {
        console.log(
          'editor received fatal error not restarting',
          error.message,
        );

        return false;
      }

      return true;
    },
  });
}
