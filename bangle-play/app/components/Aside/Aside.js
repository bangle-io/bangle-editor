import './aside.css';
import React from 'react';
import PropTypes from 'prop-types';
import { ActivityBar } from './ActivityBar';
import { SideBar } from './SideBar';
import { CollapsibleSideBarRow, SideBarRow } from './SideBarRow';
import { BaseButton } from '../Button';
import 'css.gg/icons/css/chevron-down.css';
import { ChevronDown, ChevronRight } from '../Icons/index';
import {
  workspaceActions,
  WorkspaceContext,
} from 'bangle-play/app/store/WorkspaceContext';
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
