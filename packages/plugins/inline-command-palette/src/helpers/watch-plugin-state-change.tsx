import React from 'react';
import { Plugin, EditorState } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

export function WithPlugin<IProps>(
  plugins,
  stateHandler: (
    prevState?: IProps,
    editor?: {
      prevEditorState: EditorState | undefined;
      tr: Transaction;
      view: EditorView;
      editorState: EditorState;
    },
  ) => IProps,
) {
  return (Comp) =>
    class Wrapper extends React.PureComponent<{
      addPlugins: (a: Array<any>) => void;
    }> {
      state: IProps;
      constructor(props) {
        super(props);
        this.state = stateHandler();
        props.onEditorStateUpdate(this.onEditorStateUpdate);
        props.addPlugins([...plugins]);
      }

      onEditorStateUpdate = (
        tr: Transaction,
        view: EditorView,
        prevEditorState,
        editorState,
      ) => {
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
      };

      render() {
        return <Comp {...this.props} {...this.state} />;
      }
    };
}
