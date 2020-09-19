import React from 'react';
import browser from 'bangle-core/utils/browser';
import { getIdleCallback, uuid } from 'bangle-core/utils/js-utils';
import {
  activeDatabaseName,
  activeDatabaseInstance,
} from '../store/local/database-helpers';

const DATABASE = activeDatabaseName;

console.log('using db', DATABASE);

const isMobile = browser.ios || browser.android;
const MAX_WINDOWS = isMobile ? 1 : 2;

export class DocumentManager extends React.Component {
  state = {
    openedDocuments: [],
    documentsInDisk: [],
  };

  openDocument = (docName) => {
    console.log(docName);
    this.setState({
      openedDocuments: this.updateOpenedDocuments(docName),
    });
  };

  deleteDocumentFromDisk = async (docName) => {
    console.log('deleting', docName);
    await activeDatabaseInstance.removeItem(docName);
    const documentsInDisk = await readDatabase(activeDatabaseInstance);

    if (documentsInDisk.length === 0) {
      this.createBlankDocument();
      return;
    }

    this.setState({
      openedDocuments: this.state.openedDocuments.filter(
        (r) => r.docName !== docName,
      ),
      documentsInDisk,
    });
  };

  createBlankDocument = async () => {
    const newDocName = uuid(4);
    const newDocs = this.updateOpenedDocuments(newDocName);

    this.setState(
      {
        openedDocuments: newDocs,
      },
      () => {
        getIdleCallback(async () => {
          const items = await readDatabase(activeDatabaseInstance);
          this.setState({ documentsInDisk: items });
        });
      },
    );
  };

  updateOpenedDocuments(docName) {
    const openedDoc = this.state.openedDocuments;
    const newDoc = createOpenedDocument(docName);

    if (openedDoc.length < MAX_WINDOWS) {
      return [newDoc, ...openedDoc]; // we put new things on the left
    }
    // replace the first non matching from left
    let match = openedDoc.findIndex((r) => r.docName !== docName);
    // if no match replace the first item
    if (match === -1) {
      match = 0;
    }
    const newState = openedDoc.map((doc, index) =>
      // replace the matched item with docName
      index === match ? newDoc : doc,
    );
    return newState;
  }

  async componentDidMount() {
    const getLastModifiedDoc = (docsInDisk) => {
      let lastModified = 0;
      let lastModifiedDocName;
      for (const value of docsInDisk) {
        if (value.docName && value.modified > lastModified) {
          lastModified = value.modified;
          lastModifiedDocName = value.docName;
        }
      }
      return lastModifiedDocName;
    };

    const documentsInDisk = await readDatabase(activeDatabaseInstance);
    let openedDocName =
      documentsInDisk.length === 0
        ? uuid(4)
        : getLastModifiedDoc(documentsInDisk);

    this.setState({
      openedDocuments: [createOpenedDocument(openedDocName)],
      documentsInDisk: documentsInDisk,
    });
  }

  render() {
    return this.props.children({
      openDocument: this.openDocument,
      deleteDocumentFromDisk: this.deleteDocumentFromDisk,
      createBlankDocument: this.createBlankDocument,
      openedDocuments: this.state.openedDocuments,
      documentsInDisk: this.state.documentsInDisk,
    });
  }
}

function readDatabase(databaseInstance) {
  const result = [];
  return databaseInstance
    .iterate((value, key, iterationNumber) => {
      result.push(value);
    })
    .then(() => {
      return result;
    });
}

function createOpenedDocument(docName) {
  if (typeof docName !== 'string') {
    throw new Error('docName must be string');
  }
  // we use key as React key for uniquely rendering multiple
  // instances of the same docName
  return { docName: docName, key: docName + '-' + uuid(4) };
}
