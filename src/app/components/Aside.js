import React from 'react';
import format from 'date-fns/format';
import localforage from 'localforage';

import { localManager } from '../store/local';
import { BaseButton, StackButton } from './Button';

export class Aside extends React.PureComponent {
  state = {
    showSidebar: null,
    store: localforage.createInstance({
      name: 'local_disk',
    }),
  };
  constructor(props) {
    super(props);
    this.getSavedData();
  }

  async getSavedData(result = new Map()) {
    this.newItems = [];
    return new Promise((res, rej) => {
      this.state.store
        .iterate((value, key, iterationNumber) => {
          delete value.doc;
          this.newItems.push(value);
        })
        .then(() => {
          console.log('Iteration has completed');
          res();
        })
        .catch((err) => {
          // This code runs if there were any errors
          console.error(err);
          rej(err);
        });
    });
  }

  toggleSidebar = (state = !this.state.showSidebar) => {
    this.setState({ showSidebar: state });
  };

  renderSidebar = () => {
    const legacyResults = localManager.entries
      .sort((a, b) => b.created - a.created)
      .map((r) => ({
        ...r,
        title: 'legacy ' + r.title,
      }));

    const newResults = this.newItems
      .sort((a, b) => b.created - a.created)
      .map((r) => ({
        ...r,
        title: r.title,
      }));

    // const newResults
    return [...newResults, ...legacyResults].map((entry, i) => {
      let docName = entry.docName || entry.uid;
      return (
        <div
          key={docName + i}
          onClick={() => {
            if (this.props.docName === docName) {
              return;
            }
            this.props.handleLoadEntry(entry);
          }}
          className={`flex flex-row cursor-pointer my-1 py-2 px-3 ${
            this.props.docName === docName ? `bg-gray-300` : ''
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
              if (e.title?.startsWith('legacy')) {
                await this.props.handleRemoveEntry(entry);
              } else {
                this.state.store.removeItem(docName);
                await this.getSavedData();
              }
              this.forceUpdate();
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
        <div className="aside-menu flex flex-row bg-gray-900 py-3 flex flex-col z-30 shadow-outline">
          {this.sideBarMenu()}
          {this.props.children}
        </div>
        {this.state.showSidebar ? (
          <div className="aside-content bg-gray-200  flex flex-col z-20 shadow-2xl px-3 pt-5 overflow-auto ">
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
