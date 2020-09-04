import './style/tailwind.src.css';
import './style/style.css';
import './style/prosemirror.css';
import 'prosemirror-gapcursor/style/gapcursor.css';
import React from 'react';
import { EditorContextProvider } from '../../src/utils/bangle-utils/helper-react/editor-context';
import browser from '../../src/utils/bangle-utils/utils/browser';
import localforage from 'localforage';

import { Editor } from './Editor';
import { Aside } from './components/Aside';
import {
  uuid,
  getIdleCallback,
} from '../../src/utils/bangle-utils/utils/js-utils';
import {
  getAllDbData,
  backupDb,
  putDbData,
  activeDB,
} from './store/local/database-helpers';

window.localforage = localforage;
window.backupDb = backupDb;
window.getAllDbData = getAllDbData;
window.putDbData = putDbData;

const DATABASE = activeDB;
console.log('using db', DATABASE);

const isMobile = browser.ios || browser.android;

const MAX_WINDOWS = isMobile ? 1 : 2;

export default class App extends React.PureComponent {
  state = {
    dbItems: [],
    docNames: [],
    showSidebar: false,
  };

  database = localforage.createInstance({
    name: DATABASE,
  });

  updateDocName(docName, otherState) {
    // treating left as a staging area i.e. new things will show up there
    // while right tries to stay static as much as possible
    const makeNew = (docName) => ({ docName, key: docName + '-' + uuid(4) });
    const existingDocNames = this.state.docNames;
    if (existingDocNames.length < MAX_WINDOWS) {
      this.setState({
        docNames: [makeNew(docName), ...existingDocNames], // we put new things on the left
        ...otherState,
      });

      return;
    }
    // replace the first non matching from left
    let match = existingDocNames.findIndex((r) => r.docName !== docName);
    // if no match replace the first item
    if (match === -1) {
      match = 0;
    }
    const newDocNames = existingDocNames.map((item, index) =>
      index === match ? makeNew(docName) : item,
    );

    this.setState({
      docNames: newDocNames,
      ...otherState,
    });
  }

  getDbItemsWithoutDoc = () => {
    return new Promise((res) => {
      let result = [];
      this.database
        .iterate((value, key, iterationNumber) => {
          const { doc, ...obj } = value;
          result.push(obj);
        })
        .then(() => {
          res(result);
        });
    });
  };

  getLastModifiedDocName = (items) => {
    let lastModified = 0;
    let lastModifiedKey;
    for (const value of items) {
      if (value.docName && value.modified > lastModified) {
        lastModified = value.modified;
        lastModifiedKey = value.docName;
      }
    }

    return lastModifiedKey;
  };

  async componentDidMount() {
    const dbItems = await this.getDbItemsWithoutDoc();
    let docName = this.getLastModifiedDocName(dbItems);

    if (!docName) {
      this.handleNewEntry();
    } else {
      this.updateDocName(docName, { dbItems });
    }
  }

  handleClick = (docName) => {
    this.updateDocName(docName);
  };

  handleNewEntry = async () => {
    this.updateDocName(uuid(6));

    getIdleCallback(async () => {
      this.setState({ dbItems: await this.getDbItemsWithoutDoc() });
    });
  };

  handleRemoveEntry = async (docName) => {
    console.log('requesting delete');
    await this.database.removeItem(docName);
    const dbItems = await this.getDbItemsWithoutDoc();

    if (dbItems.length === 0) {
      this.updateDocName(uuid(6), { dbItems: [] });
    } else {
      this.setState({
        docNames: this.state.docNames.filter((r) => r.docName !== docName),
        dbItems,
      });
    }
  };

  toggleSidebar = async () => {
    if (this.state.showSidebar) {
      this.setState({
        showSidebar: false,
      });
      return;
    }

    this.setState({
      showSidebar: true,
      dbItems: await this.getDbItemsWithoutDoc(),
    });
  };

  render() {
    const docNames = this.state.docNames;
    return (
      <EditorContextProvider>
        <div className="h-screen main-wrapper">
          {/* {!isMobile && <Header entry={this.state.entry} />} */}
          <div className="editor-wrapper overflow-auto">
            {docNames.length > 0 && (
              <Editor docNames={docNames} database={this.database} />
            )}
          </div>
          <Aside
            docNames={docNames}
            database={this.database}
            dbItems={this.state.dbItems}
            handleClick={this.handleClick}
            handleRemoveEntry={this.handleRemoveEntry}
            handleNewEntry={this.handleNewEntry}
            toggleSidebar={this.toggleSidebar}
            showSidebar={this.state.showSidebar}
          >
            {/* {isMobile && <Header entry={this.state.entry} />} */}
          </Aside>
        </div>
      </EditorContextProvider>
    );
  }
}
