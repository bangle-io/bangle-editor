import React from 'react';
import format from 'date-fns/format';
import localforage from 'localforage';

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

export class Aside extends React.Component {
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
      <aside className="bg-purple-500 flex flex-col h-screen z-30">
        {[...this.state.result]
          .sort(([_, a], [__, b]) => b.time - a.time)
          .map(([title, { time, dump }]) => (
            <span
              key={title}
              onClick={() => this.props.resetHistory(dump)}
              className="history-entry m-6 text-white font-bold p-2"
            >
              {title} - {format(new Date(time), 'eee dd MMM HH:mm ')}
            </span>
          ))}
      </aside>
    ) : null;
  }
}
