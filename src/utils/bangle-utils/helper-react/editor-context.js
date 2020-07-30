import React from 'react';

export const EditorContext = React.createContext(null);
export const TransactionContext = React.createContext(null);
export const EditorOnReadyContext = React.createContext(null);

const LOG = true;

function log(...args) {
  if (LOG) console.log(...args);
}

export class EditorContextProvider extends React.Component {
  state = {
    editorValue: {},
    editorUpdateKey: 0,
  };

  onEditorReady = (editor) => {
    if (!editor) {
      return;
    }

    if (
      this.state.editorValue.editor &&
      this.state.editorValue.editor !== editor
    ) {
      log('Setting a new editor');
      this.state.editorValue.editor.off('update', this.handleEditorUpdate);
    }

    this.setState({
      editorValue: { editor },
    });
    editor.on('transaction', this.handleEditorUpdate);
  };

  // TODO do we need this?
  handleEditorUpdate = () => {
    // This is needed to automatically update NodeViews in portal.js
    this.setState((state) => ({
      editorUpdateKey: state.editorUpdateKey + 1,
    }));
  };

  componentWillUnmount() {
    this.state.editorValue.editor &&
      this.state.editorValue.editor.off('update', this.handleEditorUpdate);
  }

  getEditor = () => {
    return this.state.editorValue.editor && this.state.editorValue.editor;
  };

  render() {
    return (
      <EditorOnReadyContext.Provider
        value={{ onEditorReady: this.onEditorReady }}
      >
        <EditorContext.Provider value={{ getEditor: this.getEditor }}>
          {/* <TransactionContext.Provider value={{ getEditor: this.getEditor }}> */}
          {this.props.children}
          {/* </TransactionContext.Provider> */}
        </EditorContext.Provider>
      </EditorOnReadyContext.Provider>
    );
  }
}
