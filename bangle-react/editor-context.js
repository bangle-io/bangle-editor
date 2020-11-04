import React from 'react';

export const EditorContext = React.createContext(null);
export const TransactionContext = React.createContext(null);
export const EditorOnReadyContext = React.createContext(null);

const LOG = false;

function log(...args) {
  if (LOG) {
    console.log('editor-context.js', ...args);
  }
}

export class EditorContextProvider extends React.Component {
  state = {
    editorValue: {},
    editorUpdateKey: 0,
  };

  onEditorReady = (view) => {
    return;
  };

  // TODO do we need this?
  // - we do need this for menu and other react components to react
  //    but it seems kinda wasteful
  handleEditorUpdate = () => {
    log('handleEditorUpdate updating state');
    // This is needed to automatically update NodeViews in portal.js
    // TODO: I wonder if this can cause infinite loop
    this.setState((state) => ({
      editorUpdateKey: state.editorUpdateKey + 1,
    }));
  };

  setupEditor(editor) {
    this.setState({
      editorValue: { editor },
    });
    editor.on('transaction', this.handleEditorUpdate);
  }
  transaction;

  cleanupEditor(editor) {
    editor.off('transaction', this.handleEditorUpdate);
  }

  componentWillUnmount() {
    if (this.state.editorValue.editor) {
      this.cleanupEditor(this.state.editorValue.editor);
    }
  }

  getEditor = () => {
    return this.state.editorValue && this.state.editorValue.editor;
  };

  render() {
    log('rendering editor context provider');
    return (
      <EditorContext.Provider value={{ getEditor: this.getEditor }}>
        <EditorOnReadyContext.Provider
          value={{ onEditorReady: this.onEditorReady }}
        >
          {this.props.children}
        </EditorOnReadyContext.Provider>
      </EditorContext.Provider>
    );
  }
}
