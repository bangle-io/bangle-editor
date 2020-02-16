import React from 'react';
import PropTypes from 'prop-types';

import { reactPluginUIWrapper } from './react-plugin-ui-wrapper';

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
            editorView={editorView}
          />
        ))}
      </>
    );
  }
}

MenuComponent.propTypes = {
  schema: PropTypes.object.isRequired,
  editorView: PropTypes.object.isRequired,
  menuItems: PropTypes.arrayOf(PropTypes.elementType).isRequired,
};

export const MenuItemPropTypes = {
  editorState: PropTypes.object.isRequired,
  schema: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  editorView: PropTypes.object.isRequired,
};
