import React from 'react';
import Tooltip from './Tooltip';
import typeaheadInputRulePlugin from './input-plugin';
import { EditorView } from 'prosemirror-view';
import { watchStateChange } from './helpers/watch-plugin-state-change';
import { StatePlugin2 } from './state-plugin';
import keymapPlugin from './keymaps';

export default class Main extends React.PureComponent<{
  addPlugins: (a: Array<any>) => void;
  editorView: EditorView;
}> {
  state = {
    coords: undefined,
    text: undefined,
    show: false,
  };
  constructor(props) {
    super(props);
    this.props.addPlugins([
      keymapPlugin(),
      ({ schema }) => typeaheadInputRulePlugin(schema, '@'),
      watchStateChange({
        plugin: StatePlugin2(),
        onStateChange: ({ cur, prev }) => {
          const view = (window as any).view;
          if (!cur || !prev) {
            return;
          }
          if (cur && cur.active === true) {
            this.setState({
              show: true,
              coords: {
                start: view.coordsAtPos(cur.queryMarkPos),
                end: view.coordsAtPos(cur.queryMarkPos),
              },
              text: cur.query,
            });
          }
          if (cur.active === false && prev.active === true) {
            this.setState({
              show: false,
            });
          }
        },
      }),
    ]);
  }

  render() {
    return (
      this.state.show && (
        <Tooltip
          addPlugins={this.props.addPlugins}
          coords={this.state.coords}
          text={this.state.text}
        />
      )
    );
  }
}
