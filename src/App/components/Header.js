import React from 'react';

export class Header extends React.Component {
  render() {
    return (
      <header>
        <button onClick={this.props.onSave}>Save</button>
        <button onClick={this.props.toggleSidebar}>Files</button>
      </header>
    );
  }
}
