import React from 'react';

export class Header extends React.Component {
  render() {
    return (
      <header className="bg-green-500 pr-64 flex flex-row-reverse items-center">
        <button onClick={this.props.onSave}>Save</button>
        <button onClick={this.props.toggleSidebar}>Files</button>
      </header>
    );
  }
}
