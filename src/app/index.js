import './style/tailwind.src.css';
import './style/style.css';
import './style/prosemirror.css';
import 'prosemirror-gapcursor/style/gapcursor.css';
import React from 'react';
import { EditorContextProvider } from '../../src/utils/bangle-utils/helper-react/editor-context';
import browser from '../../src/utils/bangle-utils/utils/browser';
import localforage from 'localforage';

import { Editor } from './Editor';
import { Header } from './components/Header';
import { Aside } from './components/Aside';
import {
  uuid,
  getIdleCallback,
} from '../../src/utils/bangle-utils/utils/js-utils';

window.localforage = localforage;
window.backupDb = backupDb;

const db = new URLSearchParams(window.location.search).get('database');
const DATABASE = db || 'bangle-play/v1';
console.log('using db', DATABASE);

async function backupDb(id = DATABASE, backUpId = 'backup/' + id) {
  let source = localforage.createInstance({
    name: id,
  });

  let target = localforage.createInstance({
    name: backUpId,
  });
  const items = await new Promise((res) => {
    let result = [];
    source
      .iterate((value, key, iterationNumber) => {
        result.push(value);
      })
      .then(() => {
        res(result);
      });
  });

  for (const item of items) {
    await target.setItem(item.docName || item.uid, {
      ...item,
      docName: item.docName || item.uid,
      doc: item.doc || item.content,
      version: item.version || 1,
    });
  }
}

export default class App extends React.PureComponent {
  state = {
    dbItems: [],
    docName: undefined,
    showSidebar: false,
  };

  database = localforage.createInstance({
    name: DATABASE,
  });

  updateDbItems = async () => {};

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
      this.setState({ docName, dbItems: dbItems });
    }
  }

  handleClick = (docName) => {
    this.setState({ docName });
  };

  handleNewEntry = async () => {
    this.setState({ docName: uuid(6) });
    getIdleCallback(async () => {
      this.setState({ dbItems: await this.getDbItemsWithoutDoc() });
    });
  };

  handleRemoveEntry = async (docName) => {
    await this.database.removeItem(docName);
    const dbItems = await this.getDbItemsWithoutDoc();

    if (dbItems.length === 0) {
      this.setState({ docName: uuid(6), dbItems: [] });
    } else {
      this.setState({ docName: this.getLastModifiedDocName(dbItems), dbItems });
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
    const isMobile = browser.ios || browser.android;
    const docName = this.state.docName;
    return (
      <EditorContextProvider>
        <div className="h-screen main-wrapper">
          {/* {!isMobile && <Header entry={this.state.entry} />} */}
          <div className="editor-wrapper overflow-auto">
            {docName && <Editor docName={docName} database={this.database} />}
          </div>
          <Aside
            docName={docName}
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
