import React from 'react';
import format from 'date-fns/format';
import PropTypes from 'prop-types';

import { BaseButton, StackButton } from './Button';
import { activeDB } from '../store/local/database-helpers';
const isSerious = ['production', 'staging'].includes(activeDB);

export class Aside extends React.PureComponent {
  state = {
    showSidebar: null,
  };
  static propTypes = {
    docNames: PropTypes.arrayOf(
      PropTypes.shape({ key: PropTypes.string, docName: PropTypes.string })
        .isRequired,
    ).isRequired,
  };
  renderSidebar = () => {
    const newResults = this.props.dbItems
      .filter((r) => r)
      .sort((a, b) => b.created - a.created)
      .map((r) => ({
        ...r,
        title: r.title,
      }));

    return newResults.map((entry, i) => {
      let docName = entry.docName;
      const isActive = this.props.docNames.find((r) => r.docName === docName);
      return (
        <div
          key={docName + i}
          onClick={() => {
            this.props.handleClick(docName);
          }}
          className={`flex flex-row cursor-pointer my-1 py-2 px-3 ${
            isActive ? `bg-gray-300` : ''
          } hover:bg-gray-400 rounded-lg`}
        >
          <div className="flex-1 flex flex-col">
            <span className="text-white font-bold text-gray-800">
              {entry.title}
            </span>
            <span className="text-sm font-light">
              {format(new Date(entry.modified || 0), 'eee dd MMM HH:mm')}
            </span>
          </div>
          <BaseButton
            className="text-gray-600 hover:text-gray-900"
            faType="fas fa-times-circle "
            onClick={async (e) => {
              e.stopPropagation();
              await this.props.handleRemoveEntry(docName);
            }}
          />
        </div>
      );
    });
  };

  sideBarMenu = () => (
    <>
      <div className="flex align-center justify-center">
        <StackButton
          onClick={() => this.props.toggleSidebar()}
          isActive={this.props.showSidebar}
          faType="fas fa-folder"
          stack={true}
        />
      </div>
    </>
  );

  render() {
    return (
      <>
        <div
          className={`aside-menu flex flex-row ${
            isSerious ? 'bg-pink-900' : 'bg-gray-900'
          } py-3 flex flex-col z-30 shadow-outline`}
        >
          {this.sideBarMenu()}
          {this.props.children}
        </div>
        {this.props.showSidebar ? (
          <div className="aside-content bg-gray-200  flex flex-col z-20 shadow-2xl px-3 pt-5 overflow-auto ">
            <div className="text-2xl pb-1 ml-3">Files</div>
            {this.renderSidebar()}
            <div
              className="text-xl cursor-pointer my-1 py-2 px-3 hover:bg-gray-300 rounded-lg"
              onClick={async () => {
                await this.props.handleNewEntry();
                this.props.toggleSidebar();
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
