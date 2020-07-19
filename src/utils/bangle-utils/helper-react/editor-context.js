import React from 'react';

export const EditorContext = React.createContext(null);
export const TransactionContext = React.createContext(null);
export const EditorOnReadyContext = React.createContext(null);

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
      console.log('Setting a new editor');
      this.state.editorValue.editor.off('update', this.handleEditorUpdate);
    }

    this.setState({
      editorValue: { editor },
    });

    editor.on('transaction', this.handleEditorUpdate);
  };

  handleEditorUpdate = () => {
    this.setState((state) => ({
      editorUpdateKey: state.editorUpdateKey + 1,
    }));
  };

  componentWillUnmount() {
    this.state.editorValue.editor &&
      this.state.editorValue.editor.off('update', this.handleEditorUpdate);
  }

  render() {
    return (
      <EditorOnReadyContext.Provider
        value={{ onEditorReady: this.onEditorReady }}
      >
        <EditorContext.Provider value={this.state.editorValue}>
          <TransactionContext.Provider
            value={{ editor: this.state.editorValue.editor }}
          >
            {this.props.children}
          </TransactionContext.Provider>
        </EditorContext.Provider>
      </EditorOnReadyContext.Provider>
    );
  }
}
