// polyfills
import 'core-js/es/object/from-entries';

import './style.scss';

import React from 'react';

import { Editor } from './Editor';

function App() {
  return (
    <div class="app">
      <div class="main-wrapper">
        <header onClick={() => window.handler()}>This is a header</header>
        <div className="editor-wrapper">
          <Editor />
        </div>
        <Aside />
      </div>
    </div>
  );
}

class Aside extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: true,
    };
    window.handler = () => {
      this.setState((state) => ({ show: !state.show }));
    };
  }
  render() {
    return this.state.show ? (
      <aside
        onClick={() => {
          this.setState((state) => ({ show: !state.show }));
        }}
      />
    ) : null;
  }
}
export default App;
