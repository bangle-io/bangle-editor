import React from 'react';
import { keymap } from 'prosemirror-keymap';

import Tooltip from './ui/Tooltip';
import { typeAheadInputRule } from './type-ahead-input-rule';
import {
  isTypeAheadQueryActive,
  getTypeaheadQueryString,
  findTypeAheadQuery,
} from './helpers/query';

export const commandPalettePlugins = [
  ({ schema }) => typeAheadInputRule(schema, '/'),
];

export class CommandPalette extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isActive: false,
      query: '',
      index: 0,
    };
    this._onEnter = this._onEnter.bind(this);
    this._onArrowUp = this._onArrowUp.bind(this);
    this._onArrowDown = this._onArrowDown.bind(this);
    this._handleEditorUpdate = this._handleEditorUpdate.bind(this);

    this.props.onEditorStateUpdate(
      ({ tr, view, prevEditorState, editorState }) => {
        this._handleEditorUpdate({ view, editorState });
      },
    );
  }

  _handleEditorUpdate({ view, editorState }) {
    if (!editorState) {
      return;
    }
    const isActive = isTypeAheadQueryActive(editorState);

    if (!isActive) {
      if (this.state.isActive) {
        this.setState({ isActive: false, query: null, coords: null });
      }
      return;
    }

    const queryMark = findTypeAheadQuery(editorState);

    this.setState({
      isActive,
      query: getTypeaheadQueryString(editorState),
      coords: queryMark && view.coordsAtPos(queryMark.start),
    });
  }

  _onEnter(editorState, dispatch) {
    console.log('enter pressed');
  }

  _onArrowUp(editorState, dispatch) {
    this.setState((state) => ({ index: state.index - 1 }));
  }

  _onArrowDown(editorState, dispatch) {
    this.setState((state) => ({ index: state.index + 1 }));
  }

  componentDidMount() {
    const handlerCreator = (handler) => (editorState, dispatch) => {
      if (!isTypeAheadQueryActive(editorState)) {
        return false;
      }
      if (dispatch) {
        // TOFIX need to dispatch here
        handler(editorState, dispatch);
        // dispatch(
        //   editorState.tr.setMeta(typeAheadStatePluginKey, { action: 'UP' }),
        // );
      }
      return true;
    };

    this.props.addPlugins([
      keymap({
        Enter: handlerCreator(this._onEnter),
        ArrowDown: handlerCreator(this._onArrowUp),
        ArrowUp: handlerCreator(this._onArrowDown),
      }),
    ]);
  }

  render() {
    return <Tooltip {...this.state} />;
  }
}
