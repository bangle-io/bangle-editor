import React from 'react';
import { reactPluginUIWrapper } from '../react-plugin-ui-wrapper';
import dummyMenuItems from './dummy-menu-items';

export function menuPlugin({ menuItems, schema }) {
  return reactPluginUIWrapper(
    {
      childClass: 'menu-component',
      props: {
        menuItems,
        schema,
      },
    },
    MenuComponent,
  );
}

class MenuComponent extends React.Component {
  render() {
    const { schema, editorView } = this.props;
    return (
      <div>
        {dummyMenuItems.map((Item, k) => (
          <Item
            key={k}
            schema={schema}
            editorState={editorView.state}
            dispatch={editorView.dispatch}
          />
        ))}
      </div>
    );
  }
}
