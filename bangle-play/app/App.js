import React from 'react';
import localforage from 'localforage';
import {
  getAllDbData,
  backupDb,
  putDbData,
} from './store/local/database-helpers';
import { applyTheme } from './style/apply-theme';
import { setUpManager } from './editor/setup-manager';
import { AppContainer } from './AppContainer';

window.localforage = localforage;
window.backupDb = backupDb;
window.getAllDbData = getAllDbData;
window.putDbData = putDbData;

export default class App extends React.PureComponent {
  state = {
    isSidebarOpen: true,
    theme: localStorage.getItem('theme'),
  };

  manager = setUpManager();

  async componentDidMount() {
    applyTheme(this.state.theme);
  }

  toggleTheme = async () => {
    const { theme } = this.state;
    const newTheme = theme === 'dark' ? 'light' : 'dark';

    this.setState(
      {
        theme: newTheme,
      },
      () => {
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
      },
    );
  };

  toggleSidebar = async () => {
    this.setState(({ isSidebarOpen }) => ({
      isSidebarOpen: !isSidebarOpen,
    }));
  };

  render() {
    return (
      <AppContainer
        manager={this.manager}
        isSidebarOpen={this.state.isSidebarOpen}
        toggleTheme={this.toggleTheme}
        toggleSidebar={this.toggleSidebar}
        theme={this.state.theme}
      />
    );
  }
}
