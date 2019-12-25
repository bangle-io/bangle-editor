import React from 'react';
import PropTypes from 'prop-types';

export function withEditorStateUpdate({ initialState, transformEditorState }) {
  return (Comp) => {
    class Wrapper extends React.PureComponent {
      constructor(props) {
        super(props);
        this.state = initialState;

        props.onEditorStateUpdate(
          ({ tr, view, prevEditorState, editorState }) => {
            if (!editorState) {
              return;
            }

            const newState = transformEditorState(this.state, {
              tr,
              view,
              prevEditorState,
              editorState,
            });

            if (newState !== this.state) {
              this.setState(newState);
            }
          },
        );
      }

      render() {
        return <Comp {...this.props} {...this.state} />;
      }
    }

    Wrapper.propTypes = {
      onEditorStateUpdate: PropTypes.func.isRequired,
    };

    return Wrapper;
  };
}
