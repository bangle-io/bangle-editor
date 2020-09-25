import './style/tailwind.src.css';
import './style/style.css';
import './style/prosemirror.css';
import 'prosemirror-gapcursor/style/gapcursor.css';
import PropTypes from 'prop-types';
import React from 'react';
import { EditorContextProvider } from 'bangle-core/helper-react/editor-context';
import { OpenDocumentManager } from './components/OpenDocumentManager';
import { Editor } from './components/Editor';
import { Aside } from './components/Aside';
import { Header } from './components/Header';
import browser from 'bangle-core/utils/browser';
import { Editor as OriginalEditor } from 'bangle-core';
const isMobile = browser.ios || browser.android;

export class AppContainer extends React.PureComponent {
  static propTypes = {
    manager: PropTypes.object.isRequired,
    isSidebarOpen: PropTypes.bool.isRequired,
    toggleTheme: PropTypes.func.isRequired,
    toggleSidebar: PropTypes.func.isRequired,
  };

  render() {
    const { manager, isSidebarOpen, toggleTheme, toggleSidebar } = this.props;

    return (
      <OpenDocumentManager>
        {({
          documentsInDisk,
          deleteDocumentFromDisk,
          createBlankDocument,
          openDocument,
          openedDocuments,
        }) => (
          <div className="h-screen main-wrapper">
            {/* {!isMobile && <Header entry={this.state.entry} />} */}
            <div className="editor-wrapper">
              <div className="flex justify-center flex-row">
                {openedDocuments.map((openedDocument, i) => (
                  <div
                    key={openedDocument.key}
                    className="flex-1 max-w-screen-md ml-6 mr-6"
                    style={{ height: '100vh', overflowY: 'scroll' }}
                  >
                    <EditorContextProvider>
                      <Editor
                        isFirst={i === 0}
                        docName={openedDocument.docName}
                        manager={manager}
                      />
                    </EditorContextProvider>
                    {/* adds white space at bottoms */}
                    <div
                      style={{
                        display: 'flex',
                        flexGrow: 1,
                        height: '20vh',
                        backgroundColor: 'transparent',
                      }}
                    >
                      &nbsp;
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Aside
              createBlankDocument={createBlankDocument}
              deleteDocumentFromDisk={deleteDocumentFromDisk}
              documentsInDisk={documentsInDisk}
              isSidebarOpen={isSidebarOpen}
              openDocument={openDocument}
              openedDocuments={openedDocuments}
              toggleSidebar={toggleSidebar}
              toggleTheme={toggleTheme}
            >
              {/* {isMobile && <Header entry={this.state.entry} />} */}
            </Aside>
          </div>
        )}
      </OpenDocumentManager>
    );
  }
}
