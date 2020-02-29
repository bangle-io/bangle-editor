// polyfills
import 'core-js/es/object/from-entries';

import './style/index.scss';

import React from 'react';
import { Editor } from './Editor';
import { Header } from './components/Header';
import { Aside } from './components/Aside';
import { EditorContextProvider } from 'Utils/bangle-utils/helper-react/editor-context';
export default class App extends React.PureComponent {
  state = {
    showSidebar: false,
    editor: {},
    editorUpdate: null,
  };

  toggleSidebar = (state = !this.state.showSidebar) => {
    this.setState({ showSidebar: state });
  };

  render() {
    return (
      <EditorContextProvider>
        <div className="flex h-screen main-wrapper">
          <Header toggleSidebar={this.toggleSidebar} />
          <div className="editor-wrapper overflow-auto">
            <Editor />
          </div>
          <Aside
            toggleSidebar={this.toggleSidebar}
            showSidebar={this.state.showSidebar}
          />
        </div>
      </EditorContextProvider>
    );
  }
}
