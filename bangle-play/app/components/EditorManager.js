import React from 'react';

import {
  workspaceActions,
  WorkspaceContext,
} from '../workspace/WorkspaceContext';
import { defaultContent } from './constants';
import { LocalDisk } from 'bangle-plugins/local-disk/local-disk';
import { Manager } from 'bangle-plugins/collab/server/manager';
import { specSheet } from '../editor/spec-sheet';
import { config } from 'bangle-play/config';

const DEBUG = true;

export class EditorManager extends React.PureComponent {
  static contextType = WorkspaceContext;

  schema = specSheet.schema;

  disk = new LocalDisk({
    getItem: async (docName) => {
      const file = this.context.workspace.getFile(docName);
      if (!file || file.doc === null) {
        return defaultContent;
      }
      return file.doc;
    },
    setItem: async (docName, docJson) => {
      const workspaceFile = this.context.workspace.getFile(docName);
      if (workspaceFile) {
        await workspaceFile.updateDoc(docJson);
        return;
      }
      await this.context.updateContext(
        workspaceActions.createWorkspaceFile(docName, docJson),
      );
    },
  });

  manager = new Manager(this.schema, {
    disk: this.disk,
  });

  removeAskForSave = null;

  registerAskForSave = () => {
    if (!this.context.workspace || this.removeAskForSave) {
      return;
    }
    if (
      this.context.workspace.name.includes('production') ||
      config.isProduction
    ) {
      const listener = (event) => {
        this.disk.flushAll();
        event.returnValue = `Are you sure you want to leave?`;
      };

      window.addEventListener('beforeunload', listener);
      this.removeAskForSave = () => {
        window.removeEventListener('beforeunload', listener);
      };
    }
  };

  componentDidUpdate() {
    this.registerAskForSave();
  }

  componentDidMount() {
    if (DEBUG) {
      window.manager = this.manager;
    }
    this.registerAskForSave();
  }

  componentWillUnmount() {
    this.manager.destroy();
    if (this.removeAskForSave) {
      this.removeAskForSave();
    }
  }

  render() {
    if (this.context.pendingWorkspaceInfo) {
      return (
        <div>
          Press enter twice or click here to open{' '}
          {this.context.pendingWorkspaceInfo.name}
        </div>
      );
    }
    return this.props.children(this.manager, this.context.openedDocuments);
  }
}
