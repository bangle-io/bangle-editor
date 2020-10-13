// import './WorkspacePalette.css';
import React from 'react';
import { UIContext } from 'bangle-play/app/store/UIContext';
import { Palette } from 'bangle-play/app/ui/palette';
import localforage from 'localforage';

import { SideBarRow } from '../Aside/SideBarRow';
import {
  workspaceActions,
  WorkspaceContext,
} from 'bangle-play/app/store/WorkspaceContext';
import PropTypes from 'prop-types';
import { Workspace } from '../../workspace/workspace';
import { sleep } from 'bangle-core/utils/js-utils';

const LOG = true;

let log = LOG ? console.log.bind(console, 'play/file-palette') : () => {};

export class WorkspacePalette extends React.PureComponent {
  static contextType = WorkspaceContext;

  static propTypes = {
    counter: PropTypes.number.isRequired,
    query: PropTypes.string.isRequired,
    execute: PropTypes.bool,
    onDismiss: PropTypes.func.isRequired,
  };
  state = {
    loaded: false,
  };

  async componentDidMount() {
    // Refresh the workspaces before showing them
    await this.context.updateWorkspaceContext(
      workspaceActions.updateWorkspacesInfo(),
    );
    this.setState({
      loaded: true,
    });
  }

  componentDidUpdate(prevProps) {
    const { execute } = this.props;

    // parent signals execution by setting execute to true
    // and expects the child to call dismiss once executed
    if (execute === true && prevProps.execute !== execute) {
      this.onExecuteItem();
    }
  }

  getItems() {
    if (!this.state.loaded || !this.context.availableWorkspacesInfo) {
      return [];
    }
    const query = this.props.query;
    return this.context.availableWorkspacesInfo.filter((ws) => {
      return strMatch(ws.name, query);
    });
  }

  onExecuteItem = async (activeItemIndex) => {
    const { counter } = this.props;
    const items = this.getItems();

    activeItemIndex =
      activeItemIndex == null
        ? Palette.getActiveIndex(counter, items.length)
        : activeItemIndex;

    const workspaceInfo = items[activeItemIndex];

    this.context.updateWorkspaceContext(
      workspaceActions.openWorkspaceByWorkspaceInfo(workspaceInfo),
    );
    this.props.onDismiss();
  };

  render() {
    const { counter } = this.props;
    const items = this.getItems();

    return items.map((item, i) => (
      <SideBarRow
        key={item.uid}
        isActive={Palette.getActiveIndex(counter, items.length) === i}
        title={item.name + ' (' + item.type + ')'}
        onClick={() => this.onExecuteItem(i)}
      />
    ));
  }
}

function strMatch(a, b) {
  b = b.toLocaleLowerCase().trim();
  if (Array.isArray(a)) {
    return a.filter(Boolean).some((str) => strMatch(str, b));
  }

  a = a.toLocaleLowerCase().trim();
  return a.includes(b) || b.includes(a);
}
