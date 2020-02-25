// polyfills
import 'core-js/es/object/from-entries';

import './style.scss';

import React from 'react';
import localforage from 'localforage';
import format from 'date-fns/format';
import { Editor } from './Editor';
import { Header } from './components/Header';

class Aside extends React.Component {
  state = {
    result: new Map(),
  };

  async componentDidUpdate() {
    let result = await getSavedData(this.state.result);

    this.setState({
      result,
    });
  }

  render() {
    return this.props.showSidebar ? (
      <aside>
        {[...this.state.result]
          .sort(([_, a], [__, b]) => b.time - a.time)
          .map(([title, { time, dump }]) => (
            <span
              key={title}
              onClick={() => this.props.resetHistory(dump)}
              className="history-entry"
            >
              {title} - {format(new Date(time), 'eee dd MMM HH:mm ')}
            </span>
          ))}
      </aside>
    ) : null;
  }
}

async function getSavedData(result = new Map()) {
  for (const title of (await localforage.keys()).filter(
    (title) => !result.has(title),
  )) {
    let item = await localforage.getItem(title);
    let { time, dump } = JSON.parse(item);
    result.set(title, { time, dump });
  }
  return result;
}

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
      <div class="app">
        <div class="main-wrapper">
          <Header toggleSidebar={this.toggleSidebar} onSave={this.onSave} />
          <div className="editor-wrapper">
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
