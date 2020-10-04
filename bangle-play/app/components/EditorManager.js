import ReactDOM from 'react-dom';
import React from 'react';

import { extensions } from '../editor/extensions';
import { setUpManager } from '../editor/setup-manager';
import { workspaceActions, WorkspaceContext } from '../store/WorkspaceContext';
import { getSchema } from '../editor/utils';
import { defaultContent } from './constants';

export class EditorManager extends React.PureComponent {
  static contextType = WorkspaceContext;

  schema = getSchema(extensions());

  manager = setUpManager(
    {
      getItem: async (docName) => {
        const file = this.context.workspace.getFile(docName);
        if (file.doc === null) {
          return defaultContent;
        }
        return file.doc;
        // return this.context.workspace.getFile(docName)?.doc;
      },
      setItem: async (docName, docJson) => {
        const workspaceFile = await this.context.workspace.getFile(docName);
        if (workspaceFile) {
          await workspaceFile.updateDoc(docJson);
          return;
        }
        this.context.updateContext(
          workspaceActions.createWorkspaceFile(docName, docJson),
        );
      },
    },
    this.schema,
  );

  componentWillUnmount() {
    this.manager.destroy();
  }

  render() {
    return this.props.children(this.manager, this.context.openedDocuments);
  }
}
