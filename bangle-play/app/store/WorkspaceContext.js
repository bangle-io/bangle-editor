import React from 'react';
import { extensions } from '../editor/extensions';
import { getSchema } from '../editor/utils';
import { IndexDbWorkspace, Workspace } from '../workspace/workspace';
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
      type: 'CREATE_NEW_FILE',
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
    const workspaceFile = value.workspace.getFile(docName);
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

  openWorkspaceByUid: (uid) => async (value) => {
    const workspace = await IndexDbWorkspace.openExistingWorkspace(
      uid,
      value.schema,
    );
    return workspaceActions.replaceWorkspace(workspace)(value);
  },

  createNewIndexDbWorkspace: (
    name = 'bangle-' + Math.floor(100 * Math.random()),
  ) => async (value) => {
    const workspace = await IndexDbWorkspace.createWorkspace(
      name,
      value.schema,
    );
    return workspaceActions.replaceWorkspace(workspace)(value);
  },

  openLastOpenedWorkspace: () => async (value) => {
    const availableWorkspaces = await Workspace.listWorkspaces();
    if (availableWorkspaces.length > 0) {
      const toOpen = availableWorkspaces[0];

      return workspaceActions.replaceWorkspace(
        await IndexDbWorkspace.openExistingWorkspace(toOpen.uid, value.schema),
      )(value);
    }

    return workspaceActions.createNewIndexDbWorkspace()(value);
  },

  deleteCurrentWorkspace: () => async (value) => {
    let confirm = window.confirm(
      `Are you sure you want to delete ${value.workspace.name}?`,
    );

    if (confirm) {
      await value.workspace.deleteWorkspace();
      return workspaceActions.openLastOpenedWorkspace()(value);
    } else {
      return workspaceActions.noop()(value);
    }
  },

  renameCurrentWorkspace: (newName) => async (value) => {
    const workspace = await value.workspace.rename(newName);

    return workspaceActions.replaceWorkspace(workspace)(value);
  },

  replaceWorkspace: (workspace) => async (value) => {
    return {
      type: 'REPLACE_WORKSPACE',
      payload: {
        workspace,
      },
    };
  },

  newWorkspaceFromBackup: (data) => async (value) => {
    const workspace = await IndexDbWorkspace.restoreWorkspaceFromBackupFile(
      data,
      value.schema,
    );
    return workspaceActions.replaceWorkspace(workspace)(value);
  },

  takeWorkspaceBackup: () => async (value) => {
    value.workspace.downloadBackup();
    return { type: 'NO_OP' };
  },

  noop: () => async (value) => {
    return { type: 'NO_OP' };
  },
};

const reducers = (value, { type, payload }) => {
  let newValue = value;
  if (type === 'NO_OP') {
  } else if (type === 'ERROR') {
    console.error(payload.error);
  } else if (type === 'CREATE_NEW_FILE') {
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

    // TODO this is sort of a surprise we shouldnt do this
    // as it assumes we want to persist the older workspace
    if (value.workspace) {
      value.workspace.persistWorkspace();
    }
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
  let resolvedResult;
  try {
    resolvedResult = await action(value);
  } catch (err) {
    console.error(err);
    resolvedResult = {
      type: 'ERROR',
      payload: {
        error: err,
      },
    };
    return (state) => ({
      value: reducers(state.value, resolvedResult),
    });
  }
  if (resolvedResult === undefined) {
    return (state) => state;
  }
  return (state) => ({
    value: reducers(state.value, resolvedResult),
  });
};

export class WorkspaceContextProvider extends React.PureComponent {
  get value() {
    return this.state.value;
  }

  updateWorkspaceContext = async (action) => {
    this.setState(await updateWorkspaceContext(action, this.value));
  };

  initialValue = {
    /**@type {Workspace | undefined} */
    workspace: null,
    openedDocuments: [],
    schema: getSchema(extensions()),
  };

  constructor(props) {
    super(props);
    this.state = {
      value: this.initialValue,
    };
  }

  async componentDidMount() {
    await this.updateWorkspaceContext(
      workspaceActions.openLastOpenedWorkspace(),
    );
  }

  _injectUpdateContext(value) {
    // todo deprecate this style
    value.updateContext = this.updateWorkspaceContext;
    value.updateWorkspaceContext = this.updateWorkspaceContext;
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
