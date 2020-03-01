import React from 'react';
import format from 'date-fns/format';
import { BaseButton, StackButton } from './Button';
import { EditorContext } from 'Utils/bangle-utils/helper-react/editor-context';
import { localManager } from '../store/local';

export class Aside extends React.PureComponent {
  static contextType = EditorContext;

  state = {
    showSidebar: null,
  };

  toggleSidebar = (state = !this.state.showSidebar) => {
    this.setState({ showSidebar: state });
  };

  renderSidebar = () => {
    return localManager.entries
      .sort((a, b) => b.created - a.created)
      .map((entry) => (
        <div
          key={entry.uid}
          onClick={() => {
            if (this.props.entry.uid === entry.uid) {
              return;
            }
            this.props.handleLoadEntry(entry);
          }}
          className={`flex flex-row cursor-pointer my-1 py-2 px-3 ${
            this.props.entry.uid === entry.uid ? `bg-gray-300` : ''
          } hover:bg-gray-400 rounded-lg`}
        >
          <div className="flex-1 flex flex-col">
            <span className="text-white font-bold text-gray-800">
              {entry.title}
            </span>
            <span className="text-sm font-light">
              {format(new Date(entry.modified), 'eee dd MMM HH:mm')}
            </span>
          </div>
          <BaseButton
            className="text-gray-600 hover:text-gray-900"
            faType="fas fa-times-circle "
            onClick={async (e) => {
              e.stopPropagation();
              await this.props.handleRemoveEntry(entry);
              this.forceUpdate();
            }}
          />
        </div>
      ));
  };

  sideBarMenu = () => (
    <>
      <div className="flex align-center justify-center">
        <StackButton
          onClick={() => this.toggleSidebar()}
          isActive={this.state.showSidebar}
          faType="fas fa-folder"
          stack={true}
        />
      </div>
    </>
  );

  render() {
    return (
      <>
        <div className="aside-menu bg-gray-900 py-6 flex flex-col h-screen z-30 shadow-outline">
          {this.sideBarMenu()}
        </div>
        {this.state.showSidebar ? (
          <div className="aside-content bg-gray-200  flex flex-col z-20 h-screen shadow-2xl px-3 pt-5 overflow-auto ">
            <div className="text-2xl pb-1 ml-3">Files</div>
            {this.renderSidebar()}
            <div
              className="text-xl cursor-pointer my-1 py-2 px-3 hover:bg-gray-300 rounded-lg"
              onClick={async () => {
                await this.props.handleNewEntry();
                this.toggleSidebar();
              }}
            >
              New
            </div>
          </div>
        ) : null}
      </>
    );
  }
}
