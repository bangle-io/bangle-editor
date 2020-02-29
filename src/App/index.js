// polyfills
import 'core-js/es/object/from-entries';

import './style/index.scss';

import React from 'react';
import localforage from 'localforage';
import { Editor } from './Editor';
import { Header } from './components/Header';
import { Aside, getSavedData } from './components/Aside';

async function getMostRecentEntry(result) {
  result = await result;

  return [...result].map((r) => r[1]).sort((a, b) => b.time - a.time)[0];
}

function getFileTitle(dump) {
  let title = dump.content.find((r) => r.type === 'heading');

  if (!title) {
    throw new Error('need heading to save');
  }
  return title.content.map((r) => r.text).join(':');
}

export default class App extends React.Component {
  grabbedLastSaved = false;
  grabLastSaved = async () => {
    if (this.grabbedLastSaved) {
      return;
    }
    const lastSaved = await getMostRecentEntry(getSavedData());
    if (lastSaved && this.editor) {
      this.grabbedLastSaved = true;
      this.resetHistory(lastSaved.dump);
    }
    if (!lastSaved && this.editor) {
      this.grabbedLastSaved = true;
    }
  };
  async componentDidMount() {
    this.grabLastSaved();
  }

  state = {
    showSidebar: false,
  };
  toggleSidebar = () => {
    this.setState((state) => ({ showSidebar: !state.showSidebar }));
  };
  onSave = async () => {
    const dump = this.editor.getJSON();
    await localforage.setItem(
      getFileTitle(dump),
      JSON.stringify({ time: new Date().getTime(), dump }),
    );
    this.setState({
      showSidebar: false,
    });
  };
  onEditorUpdate = (payload) => {};
  onEditorReady = (editor) => {
    if (!this.editor) {
      this.editor = editor;
      this.grabLastSaved();
    }
  };
  resetHistory = (dump) => {
    this.editor.setContent(dump);
  };
  render() {
    return (
      <div className="flex">
        <div className="flex-1 h-screen main-wrapper">
          <Header toggleSidebar={this.toggleSidebar} onSave={this.onSave} />
          <div className="editor-wrapper overflow-auto">
            <Editor
              onEditorReady={this.onEditorReady}
              onEditorUpdate={this.onEditorUpdate}
            />
          </div>
          <Aside
            showSidebar={this.state.showSidebar}
            resetHistory={this.resetHistory}
          />
        </div>
      </div>
    );
  }
}
