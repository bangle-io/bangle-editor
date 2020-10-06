import './aside.css';
import React from 'react';
import { ActivityBar } from './ActivityBar';
import { FileBrowser } from './FileBrowser';
import { UIContext } from 'bangle-play/app/store/UIContext';

export class Aside extends React.PureComponent {
  render() {
    return (
      <UIContext.Consumer>
        {({ isSidebarOpen, updateContext }) => (
          <>
            <ActivityBar
              isSidebarOpen={isSidebarOpen}
              updateUIContext={updateContext}
            />
            {isSidebarOpen ? (
              <FileBrowser updateUIContext={updateContext} />
            ) : null}
          </>
        )}
      </UIContext.Consumer>
    );
  }
}
