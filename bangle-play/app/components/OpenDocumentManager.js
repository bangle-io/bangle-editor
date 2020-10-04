import React from 'react';
import browser from 'bangle-core/utils/browser';
import { getIdleCallback, uuid } from 'bangle-core/utils/js-utils';
import PropTypes from 'prop-types';
import { WorkspaceFile } from '../workspace/workspace-file';
import { WorkspaceContext } from '../store/WorkspaceContext';

const isMobile = browser.ios || browser.android;
const MAX_WINDOWS =
  new URLSearchParams(window.location.search).get('single-pane') || isMobile
    ? 1
    : 2;

export class OpenWorkspaceFilesManager extends React.Component {
  static contextType = WorkspaceContext;
  // static propTypes = {
  //   workspaceFiles: PropTypes.arrayOf(PropTypes.instanceOf(WorkspaceFile)),
  //   newWorkspaceFile: PropTypes.func.isRequired,
  // };
  // state = {
  //   openedDocuments: [],
  // };

  // openWorkspaceFile = (docName) => {
  //   if (this.props.workspaceFiles.find((w) => w.docName === docName)) {
  //     this.setState({
  //       openedDocuments: this.updateOpenedDocuments(docName),
  //     });
  //   } else {
  //     throw new Error('Docname not found ' + docName);
  //   }
  // };

  // openBlankWorkspaceFile = async () => {
  //   const newDocName = uuid(8);
  //   // TODO lets move all this redux :'9
  //   await this.props.newWorkspaceFile(newDocName, null);

  //   getIdleCallback(async () => {
  //     this.openWorkspaceFile(newDocName);
  //   });
  // };

  // updateOpenedDocuments(docName) {
  //   const openedDoc = this.state.openedDocuments;
  //   const newDoc = createOpenedDocument(docName);

  //   if (openedDoc.length < MAX_WINDOWS) {
  //     return [newDoc, ...openedDoc]; // we put new things on the left
  //   }
  //   // replace the first non matching from left
  //   let match = openedDoc.findIndex((r) => r.docName !== docName);
  //   // if no match replace the first item
  //   if (match === -1) {
  //     match = 0;
  //   }
  //   const newState = openedDoc.map((doc, index) =>
  //     // replace the matched item with docName
  //     index === match ? newDoc : doc,
  //   );
  //   return newState;
  // }

  // async componentDidMount() {
  //   // If nothing in workspace create a blank document
  //   const workspaceFiles = this.props.workspaceFiles;
  //   let openedDocName =
  //     workspaceFiles.length === 0 ? uuid(4) : workspaceFiles[0].docName;

  //   this.setState({
  //     openedDocuments: [createOpenedDocument(openedDocName)],
  //   });
  // }

  // async componentDidUpdate() {
  //   const workspaceFiles = this.props.workspaceFiles;
  //   const newFiles = this.state.openedDocuments.filter(({ docName }) =>
  //     workspaceFiles.find((w) => w.docName === docName),
  //   );

  //   if (newFiles.length !== this.state.openedDocuments.length) {
  //     this.setState({
  //       openedDocuments: newFiles,
  //     });
  //   }
  // }

  render() {
    const { openedDocuments, actions, update } = this.context;
    return this.props.children({
      openWorkspaceFile: (...payload) =>
        update(actions.openWorkspaceFile(...payload)),
      openedDocuments: openedDocuments,
      openBlankWorkspaceFile: this.openBlankWorkspaceFile,
    });
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
