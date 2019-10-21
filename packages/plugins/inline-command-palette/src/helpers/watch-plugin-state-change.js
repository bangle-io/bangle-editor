import React from 'react';

export function WithPlugin(plugins, stateHandler) {
  return (Comp) =>
    class Wrapper extends React.PureComponent {
      constructor(props) {
        super(props);
        this.onEditorStateUpdate = this.onEditorStateUpdate.bind(this);
        this.state = stateHandler();
        props.onEditorStateUpdate(this.onEditorStateUpdate);
        props.addPlugins([...plugins]);
      }

      onEditorStateUpdate(tr, view, prevEditorState, editorState) {
        if (!editorState) {
          return;
        }

        const newState = stateHandler(this.state, {
          tr,
          view,
          prevEditorState,
          editorState,
        });
        if (newState !== this.state) {
          this.setState(newState);
        }
      }

      render() {
        return <Comp {...this.props} {...this.state} />;
      }
    };
}
