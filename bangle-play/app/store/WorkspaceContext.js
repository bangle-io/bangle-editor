import React from 'react';
import { extensions } from '../editor/extensions';
import { getSchema } from '../editor/utils';
import localforage from 'localforage';
import { IndexDbWorkspace } from '../workspace/workspace';
import { activeDatabaseName } from './local/database-helpers';
import { uuid } from 'bangle-core/utils/js-utils';
import browser from 'bangle-core/utils/browser';

const isMobile = browser.ios || browser.android;

const MAX_WINDOWS =
  new URLSearchParams(window.location.search).get('single-pane') || isMobile
    ? 1
    : 2;
export const WorkspaceContext = React.createContext(undefined);

export const workspaceActions = {
  createWorkspaceFile: (docName, docJson) => async (value) => {
    const newFile = await value.workspace.createFile(docName, docJson);
    return {
      type: 'NEW_FILE',
      payload: {
        file: newFile,
      },
    };
  },

  openWorkspaceFile: (docName) => async (value) => {
    return {
      type: 'OPEN_FILE',
      payload: {
        docName: docName,
      },
    };
  },

  openBlankWorkspaceFile: () => async (value) => {
    const newDocName = uuid(8);
    const newFile = await value.workspace.createFile(newDocName, null);
    return {
      type: 'OPEN_NEW_FILE',
      payload: {
        file: newFile,
      },
    };
  },

  deleteWorkspaceFile: (docName) => async (value) => {
    const workspaceFile = await value.workspace.getFile(docName);
    if (workspaceFile) {
      await workspaceFile.delete();
      return {
        type: 'DELETE_FILE',
        payload: {
          file: workspaceFile,
        },
      };
    }
  },

  replaceWorkspace: (workspace) => async (value) => {
    return {
      type: 'REPLACE_WORKSPACE',
      payload: {
        workspace,
      },
    };
  },
};

const reducers = (value, { type, payload }) => {
  let newValue = value;
  if (type === 'NEW_FILE') {
    const { file } = payload;
    newValue = {
      ...value,
      workspace: value.workspace.linkFile(file),
    };
  } else if (type === 'OPEN_NEW_FILE') {
    const { file } = payload;
    newValue = {
      ...value,
      workspace: value.workspace.linkFile(file),
      openedDocuments: calculateOpenedDocuments(
        file.docName,
        value.openedDocuments,
      ),
    };
  } else if (type === 'OPEN_FILE') {
    const { docName } = payload;
    if (value.workspace.files.find((w) => w.docName === docName)) {
      newValue = {
        ...value,
        openedDocuments: calculateOpenedDocuments(
          docName,
          value.openedDocuments,
        ),
      };
    }
  } else if (type === 'REPLACE_WORKSPACE') {
    const { workspace } = payload;
    let openedDocName =
      workspace.files.length === 0 ? uuid(4) : workspace.files[0].docName;

    newValue = {
      ...value,
      workspace,
      openedDocuments: calculateOpenedDocuments(openedDocName, []),
    };
  } else if (type === 'DELETE_FILE') {
    const { file } = payload;
    const workspace = value.workspace.unlinkFile(file);
    const newFiles = value.openedDocuments.filter(({ docName }) =>
      workspace.files.find((w) => w.docName === docName),
    );
    newValue = {
      ...value,
      workspace,
      openedDocuments: newFiles,
    };
  } else {
    throw new Error('Unknown type');
  }

  return newValue;
};

export const updateWorkspaceContext = async (action, value) => {
  const resolvedResult = await action(value);
  return (state) => ({
    value: reducers(state.value, resolvedResult),
  });
};

export class WorkspaceContextProvider extends React.PureComponent {
  schema = getSchema(extensions());

  get value() {
    return this.state.value;
  }

  updateContext = async (action) => {
    this.setState(await updateWorkspaceContext(action, this.value));
  };

  initialValue = {
    /**@type {Workspace | undefined} */
    workspace: null,
    openedDocuments: [],
  };

  constructor(props) {
    super(props);
    this.state = {
      value: this.initialValue,
    };
  }

  async componentDidMount() {
    const workspace = await IndexDbWorkspace.create(activeDatabaseName, {
      schema: this.schema,
      dbInstance: localforage.createInstance({
        name: activeDatabaseName,
      }),
    });
    await this.updateContext(workspaceActions.replaceWorkspace(workspace));
  }

  _injectUpdateContext(value) {
    value.updateContext = this.updateContext;
    return value;
  }

  render() {
    return (
      <WorkspaceContext.Provider value={this._injectUpdateContext(this.value)}>
        {this.props.children}
      </WorkspaceContext.Provider>
    );
  }
}

function createOpenedDocument(docName) {
  if (typeof docName !== 'string') {
    throw new Error('docName must be string');
  }
  // we use key as React key for uniquely rendering multiple
  // instances of the same docName
  return { docName: docName, key: docName + '-' + uuid(4) };
}

function calculateOpenedDocuments(docName, openedDocuments) {
  const newDoc = createOpenedDocument(docName);

  if (openedDocuments.length < MAX_WINDOWS) {
    return [newDoc, ...openedDocuments]; // we put new things on the left
  }
  // replace the first non matching from left
  let match = openedDocuments.findIndex((r) => r.docName !== docName);
  // if no match replace the first item
  if (match === -1) {
    match = 0;
  }
  const newState = openedDocuments.map((doc, index) =>
    // replace the matched item with docName
    index === match ? newDoc : doc,
  );
  return newState;
}
