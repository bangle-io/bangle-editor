import React from 'react';
import PropTypes from 'prop-types';
import { Fragment, Node } from 'prosemirror-model';
import { PluginKey } from 'prosemirror-state';
import { keymap } from 'prosemirror-keymap';
import Tooltip from './ui/Tooltip';
import { typeAheadInputRule } from './type-ahead-input-rule';
import {
  isTypeAheadQueryActive,
  getTypeaheadQueryString,
  findTypeAheadQuery,
} from './helpers/query';
import { SELECT_CURRENT } from './action';
import { selectItem } from './commands';

const TRIGGER = '/';
export const commandPalettePlugins = [
  ({ schema }) => typeAheadInputRule(schema, TRIGGER),
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
      coords: view.coordsAtPos(queryMark.start),
    });
  }

  _onEnter(editorState, dispatch) {
    return selectItem({
      item: this.props.items[this.state.index],
      trigger: TRIGGER,
    })(editorState, dispatch);
  }

  _onArrowUp(editorState, dispatch) {
    this.setState((state) => ({
      index:
        (this.props.items.length + state.index - 1) % this.props.items.length,
    }));
    return true;
  }

  _onArrowDown(editorState, dispatch) {
    this.setState((state) => ({
      index: (state.index + 1) % this.props.items.length,
    }));
    return true;
  }

  componentDidMount() {
    const commandCreator = (command) => (editorState, dispatch) => {
      if (!isTypeAheadQueryActive(editorState)) {
        return false;
      }
      return command(editorState, dispatch);
    };

    this.props.addPlugins([
      keymap({
        Enter: commandCreator(this._onEnter),
        ArrowDown: commandCreator(this._onArrowUp),
        ArrowUp: commandCreator(this._onArrowDown),
      }),
    ]);
  }

  render() {
    return <Tooltip {...this.state} items={this.props.items} />;
  }
}

CommandPalette.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  addPlugins: PropTypes.func.isRequired,
  onEditorStateUpdate: PropTypes.func.isRequired,
};
