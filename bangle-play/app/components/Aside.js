import React from 'react';
import format from 'date-fns/format';
import PropTypes from 'prop-types';

import { BaseButton, StackButton } from './Button';
import { activeDatabaseName, backupDb } from '../store/local/database-helpers';
const isSerious = ['production', 'staging'].includes(activeDatabaseName);

export class Aside extends React.PureComponent {
  static propTypes = {
    children: PropTypes.element,
    createBlankDocument: PropTypes.func.isRequired,
    deleteDocumentFromDisk: PropTypes.func.isRequired,
    documentsInDisk: PropTypes.array.isRequired,
    isSidebarOpen: PropTypes.bool.isRequired,
    openDocument: PropTypes.func.isRequired,
    workspaces: PropTypes.array.isRequired,
    openedDocuments: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string,
        docName: PropTypes.string,
      }).isRequired,
    ).isRequired,
    toggleSidebar: PropTypes.func.isRequired,
    toggleTheme: PropTypes.func.isRequired,
  };

  downloadAllDocuments = () => {
    backupDb();
  };

  renderWorkspace = (workspace) => {
    const newResults = this.props.documentsInDisk
      .filter((r) => r)
      .sort((a, b) => b.created - a.created)
      .map((r) => ({
        ...r,
        title: r.title,
      }));
    return newResults.map((entry, i) => {
      let docName = entry.docName;
      const isActive = this.props.openedDocuments.find(
        (r) => r.docName === docName,
      );
      return (
        <div
          key={docName + i}
          onClick={() => {
            this.props.openDocument(docName);
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
              await this.props.deleteDocumentFromDisk(docName);
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
          isActive={this.props.isSidebarOpen}
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
          className={`grid-activity-bar flex flex-row ${
            isSerious ? 'bg-pink-900' : 'bg-gray-900'
          } py-3 flex flex-col z-30`}
        >
          {this.sideBarMenu()}
          {this.props.children}
        </div>
        {this.props.isSidebarOpen ? (
          <div className="aside-content bg-stronger  flex flex-col z-20 shadow-2xl px-3 pt-5 overflow-auto ">
            <div className="text-2xl pb-1 ml-3">Files</div>
            <div
              className="text-xl cursor-pointer my-1 py-2 px-3 hover:bg-gray-300 rounded-lg"
              onClick={async () => {
                this.props.toggleTheme();
              }}
            >
              Theme Toggle
            </div>
            <div
              className="text-xl cursor-pointer my-1 py-2 px-3 hover:bg-gray-300 rounded-lg"
              onClick={async () => {
                this.downloadAllDocuments();
              }}
            >
              Dump data
            </div>
            {this.props.workspaces.map((w) => this.renderWorkspace())}
            <div
              className="text-xl cursor-pointer my-1 py-2 px-3 hover:bg-gray-300 rounded-lg"
              onClick={async () => {
                await this.props.createBlankDocument();
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
