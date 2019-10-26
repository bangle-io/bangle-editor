import React from 'react';
import { reactPluginUIWrapper } from '../react-plugin-ui-wrapper';

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
    const { schema, editorView, menuItems } = this.props;
    return (
      <>
        {menuItems.map((MenuItem, k) => (
          <MenuItem
            key={k}
            schema={schema}
            editorState={editorView.state}
            dispatch={editorView.dispatch}
          />
        ))}
      </>
    );
  }
}
