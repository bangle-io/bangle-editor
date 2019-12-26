import React from 'react';
import PropTypes from 'prop-types';
import { keymap } from 'prosemirror-keymap';
import Tooltip from './ui/Tooltip';
import { typeAheadInputRule } from './type-ahead-input-rule';
import {
  isTypeAheadQueryActive,
  getTypeaheadQueryString,
  findTypeAheadQuery,
  doesQueryHaveTrigger,
} from './helpers/query';
import { selectItem, removeTypeAheadMark } from './commands';

const TRIGGER = '/';

export const commandPalettePlugins = [
  ({ schema }) => typeAheadInputRule(schema, TRIGGER),
];

export class CommandPalette extends React.Component {
  constructor(props) {
    super(props);
    this.initialState = {
      isActive: false,
      query: null,
      index: 0,
      nodeDOM: null,
    };
    this.state = this.initialState;
    this._handleEditorUpdate = this._handleEditorUpdate.bind(this);
    this._handleItemClick = this._handleItemClick.bind(this);
    this.props.onEditorStateUpdate(this._handleEditorUpdate);
  }

  _handleItemClick(selectedIndex) {
    if (this.view && this.editorState) {
      commandCreator(
        selectItem({
          item: this.props.items[selectedIndex],
          trigger: TRIGGER,
        }),
      )(this.editorState, this.view.dispatch);
      this.view.focus();
    }
  }

  _handleEditorUpdate({ view, editorState }) {
    this.view = view;
    this.editorState = editorState;
    if (!editorState) {
      return;
    }

    const isActive = isTypeAheadQueryActive(editorState);

    if (!isActive) {
      if (this.state.isActive) {
        this.setState(this.initialState);
      }
      return;
    }

    // Disable type ahead query when removing trigger.
    if (isActive && !doesQueryHaveTrigger(editorState)) {
      removeTypeAheadMark()(editorState, view.dispatch);
      return this.setState(this.initialState);
    }

    const queryMark = findTypeAheadQuery(editorState);
    // not sure but I guess if you press enter and your
    // query is in new paragraph, queryMark will be empty
    if (!queryMark || queryMark.start === -1) {
      return this.setState(this.initialState);
    }
    const query = getTypeaheadQueryString(editorState);

    this.setState({
      isActive,
      query,
      nodeDOM: view.nodeDOM(queryMark.start),
    });
  }

  componentDidMount() {
    const keymapPlugin = keymap({
      Enter: commandCreator((editorState, dispatch) => {
        return selectItem({
          item: this.props.items[this.state.index],
          trigger: TRIGGER,
        })(editorState, dispatch);
      }),
      ArrowUp: commandCreator((editorState, dispatch) => {
        this.setState((state, props) => ({
          index: (props.items.length + state.index - 1) % props.items.length,
        }));
        return true;
      }),
      ArrowDown: commandCreator((editorState, dispatch) => {
        this.setState((state) => ({
          index: (state.index + 1) % this.props.items.length,
        }));
        return true;
      }),
      Escape: commandCreator(removeTypeAheadMark()),
    });

    this.props.addPlugins([keymapPlugin]);
  }

  render() {
    return (
      <Tooltip
        {...this.state}
        items={this.props.items}
        handleItemClick={this._handleItemClick}
      />
    );
  }
}

CommandPalette.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
    }),
  ).isRequired,
  addPlugins: PropTypes.func.isRequired,
  onEditorStateUpdate: PropTypes.func.isRequired,
};

function commandCreator(command) {
  return (editorState, dispatch) => {
    if (!isTypeAheadQueryActive(editorState)) {
      return false;
    }
    return command(editorState, dispatch);
  };
}
