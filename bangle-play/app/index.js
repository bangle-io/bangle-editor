import './style/tailwind.src.css';
import './style/style.css';
import './style/prosemirror.css';
import 'prosemirror-gapcursor/style/gapcursor.css';

import React from 'react';
import localforage from 'localforage';
import { EditingArea } from './components/EditingArea';
import { Aside } from './components/Aside';
import {
  getAllDbData,
  backupDb,
  putDbData,
} from './store/local/database-helpers';
import { applyTheme } from './style/apply-theme';
import { DocumentManager } from './components/DocumentManager';
window.localforage = localforage;
window.backupDb = backupDb;
window.getAllDbData = getAllDbData;
window.putDbData = putDbData;

export default class Index extends React.PureComponent {
  state = {
    isSidebarOpen: false,
    theme: localStorage.getItem('theme'),
  };

  async componentDidMount() {
    applyTheme(this.state.theme);
  }

  toggleTheme = async () => {
    const { theme } = this.state;
    const newTheme = theme === 'dark' ? 'light' : 'dark';

    this.setState(
      {
        theme: newTheme,
      },
      () => {
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
      },
    );
  };

  toggleSidebar = async () => {
    if (this.state.isSidebarOpen) {
      this.setState({
        isSidebarOpen: false,
      });
      return;
    }

    this.setState({
      isSidebarOpen: true,
    });
  };

  render() {
    return (
      <DocumentManager>
        {({
          documentsInDisk,
          deleteDocumentFromDisk,
          createBlankDocument,
          openDocument,
          openedDocuments,
        }) => (
          <div className="h-screen main-wrapper">
            {/* {!isMobile && <Header entry={this.state.entry} />} */}
            <div className="editor-wrapper overflow-auto">
              {openedDocuments.length > 0 && (
                <EditingArea openedDocuments={openedDocuments} />
              )}
            </div>
            <Aside
              openedDocuments={openedDocuments}
              documentsInDisk={documentsInDisk}
              openDocument={openDocument}
              deleteDocumentFromDisk={deleteDocumentFromDisk}
              createBlankDocument={createBlankDocument}
              downloadAllDocuments={this.downloadAllDocuments}
              toggleSidebar={this.toggleSidebar}
              isSidebarOpen={this.state.isSidebarOpen}
              toggleTheme={this.toggleTheme}
            >
              {/* {isMobile && <Header entry={this.state.entry} />} */}
            </Aside>
          </div>
        )}
      </DocumentManager>
    );
  }
}
