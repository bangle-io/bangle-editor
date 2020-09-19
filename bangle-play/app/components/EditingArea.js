import React from 'react';
import PropTypes from 'prop-types';
import { Manager } from 'bangle-plugins/collab/server/manager';
import { Disk } from 'bangle-plugins/persistence/disk';
import { defaultContent } from './constants';
import { getSchema } from '../editor/utils';
import { Editor } from './Editor';
import { CollabEditor } from 'bangle-plugins/collab/CollabClient';
import { extensions } from '../editor/extensions';
import {
  activeDatabaseName,
  activeDatabaseInstance,
} from '../store/local/database-helpers';
import { EditorContextProvider } from 'bangle-core/helper-react/editor-context';

const DEBUG = true;

export class EditingArea extends React.Component {
  static propTypes = {
    openedDocuments: PropTypes.arrayOf(
      PropTypes.exact({ key: PropTypes.string, docName: PropTypes.string })
        .isRequired,
    ).isRequired,
  };
  constructor(props) {
    super(props);
    const schema = getSchema(extensions());
    const disk = new Disk({
      db: activeDatabaseInstance,
      defaultDoc: defaultContent,
    });
    this.manager = new Manager(schema, {
      disk,
    });

    if (
      activeDatabaseName === 'production' ||
      process.env.NODE_ENV === 'production'
    ) {
      window.addEventListener('beforeunload', (event) => {
        disk.myMainDisk.flushAll();
        event.returnValue = `Are you sure you want to leave?`;
      });
    }

    if (DEBUG) {
      window.manager = this.manager;
    }
  }

  render() {
    console.log(this.props.openedDocuments);
    return (
      <div className="flex justify-center flex-row">
        {this.props.openedDocuments.map((openedDocument, i) => (
          <div
            key={openedDocument.key}
            className="flex-1 max-w-screen-md ml-6 mr-6"
            style={{ overflow: 'scroll', height: '90vh' }}
          >
            <EditorContextProvider>
              <Editor
                isFirst={i === 0}
                docName={openedDocument.docName}
                manager={this.manager}
                editor={CollabEditor}
              />
            </EditorContextProvider>
          </div>
        ))}
      </div>
    );
  }
}
