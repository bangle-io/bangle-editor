import React from 'react';
import format from 'date-fns/format';
import localforage from 'localforage';
import { Button, StackButton } from './Button';
import { EditorContext } from 'Utils/bangle-utils/helper-react/editor-context';

export async function getSavedData(result = new Map()) {
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

export class Aside extends React.Component {
  static contextType = EditorContext;
  grabbedLastSaved = false;
  state = {
    result: new Map(),
  };

  async componentDidMount() {
    const result = await getSavedData();
    await this.grabLastSaved();

    this.setState({
      result,
    });
  }

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

  resetHistory = (dump) => {
    this.context.editor && this.context.editor.setContent(dump);
  };

  renderSiderbar = () => {
    return [...this.state.result]
      .sort(([_, a], [__, b]) => b.time - a.time)
      .map(([title, { time, dump }]) => (
        <div
          key={title}
          onClick={() => this.resetHistory(dump)}
          className="flex flex-col cursor-pointer my-1 py-2 px-3 hover:bg-gray-300 rounded-lg"
        >
          <span className="text-white font-bold text-gray-800">{title}</span>
          <span className="text-sm font-light">
            {format(new Date(time), 'eee dd MMM HH:mm')}
          </span>
        </div>
      ));
  };

  sideBarMenu = () => [
    <div className="flex align-center justify-center">
      <StackButton
        onClick={() => this.props.toggleSidebar()}
        isActive={this.props.showSidebar}
        faType="fas fa-folder"
        stack={true}
      />
    </div>,
  ];

  render() {
    return (
      <>
        <div className="aside-menu bg-gray-900 py-6 flex flex-col h-screen z-30 shadow-outline">
          {this.sideBarMenu()}
        </div>
        {this.props.showSidebar ? (
          <div className="aside-content bg-gray-200  flex flex-col z-20 h-screen shadow-2xl px-3 pt-5 ">
            <div className="text-2xl pb-3">Files</div>
            {this.renderSiderbar()}
          </div>
        ) : null}
      </>
    );
  }
}
