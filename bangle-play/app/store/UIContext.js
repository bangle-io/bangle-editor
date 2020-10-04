import React from 'react';
import browser from 'bangle-core/utils/browser';
import { applyTheme } from '../style/apply-theme';
const isMobile = browser.ios || browser.android;

export const UIContext = React.createContext();

export const UIActions = {
  toggleSidebar: () => async (value) => {
    return {
      type: 'TOGGLE_SIDEBAR',
    };
  },
  toggleTheme: () => async (value) => {
    return {
      type: 'TOGGLE_THEME',
    };
  },
};

const reducers = (value, { type, payload }) => {
  let newValue = value;
  if (type === 'TOGGLE_SIDEBAR') {
    newValue = {
      ...value,
      isSidebarOpen: !value.isSidebarOpen,
    };
  } else if (type === 'TOGGLE_THEME') {
    newValue = {
      ...value,
      theme: value.theme === 'dark' ? 'light' : 'dark',
    };
    localStorage.setItem('theme', newValue.theme);
    applyTheme(newValue.theme);
  } else {
    throw new Error('Unknown type ' + type);
  }

  return newValue;
};

export class UIContextProvider extends React.PureComponent {
  get value() {
    return this.state.value;
  }

  updateContext = async (action) => {
    const resolvedResult = await action(this.value);
    this.setState((state) => ({
      value: reducers(state.value, resolvedResult),
    }));
  };

  initialValue = {
    isSidebarOpen: false,
    theme: localStorage.getItem('theme'),
  };

  constructor(props) {
    super(props);
    this.state = {
      value: this.initialValue,
    };
    applyTheme(this.value.theme);
  }

  _injectUpdateContext(value) {
    value.updateContext = this.updateContext;
    return value;
  }

  render() {
    return (
      <UIContext.Provider value={this._injectUpdateContext(this.value)}>
        {this.props.children}
      </UIContext.Provider>
    );
  }
}
