// polyfills
import 'core-js/es/object/from-entries';

import './style/index.scss';

import React from 'react';
import { Editor } from './Editor';
import { Header } from './components/Header';
import { Aside } from './components/Aside';
import { EditorContextProvider } from 'utils/bangle-utils/helper-react/editor-context';
import { localManager } from './store/local';
import { defaultContent } from './components/constants';

const lastSavedContent = localManager.lastModifiedEntry();

export default class App extends React.PureComponent {
  state = {
    entry: undefined,
  };

  async componentDidMount() {
    let entry = await lastSavedContent;
    if (!entry) {
      console.log('no lastSavedContent');
      entry = await localManager.saveEntry({ content: defaultContent });
    }
    this.setState({ entry });
  }

  handleLoadEntry = (entry) => {
    this.setState({ entry });
  };

  handleNewEntry = async () => {
    const entry = await localManager.saveEntry({ content: defaultContent });
    this.setState({ entry });
  };

  handleRemoveEntry = async (entry) => {
    await localManager.removeEntry(entry);
    this.setState({ entry: await localManager.lastModifiedEntry() });
  };

  render() {
    return (
      <EditorContextProvider>
        <div className="flex h-screen main-wrapper">
          <Header entry={this.state.entry} />
          <div className="editor-wrapper overflow-auto">
            {this.state.entry && <Editor entry={this.state.entry} />}
          </div>
          <Aside
            entry={this.state.entry}
            handleLoadEntry={this.handleLoadEntry}
            handleRemoveEntry={this.handleRemoveEntry}
            handleNewEntry={this.handleNewEntry}
            toggleSidebar={this.toggleSidebar}
          />
        </div>
      </EditorContextProvider>
    );
  }
}
