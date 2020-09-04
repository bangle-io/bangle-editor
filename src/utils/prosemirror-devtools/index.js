import './index.css';
import React, { useRef, useState, useEffect } from 'react';
import { PrettyObj } from './PrettyObj';

export const ProseMirrorDevtools = React.memo(function ProseMirrorDevtools({
  view,
}) {
  console.log('here');
  return <Main view={view} />;
});

function Main({ view }) {
  const [toggle, toggleDevtools] = useState(false);
  const [activeTab, changeTab] = useState('state');
  console.log(toggle, activeTab);

  return !toggle ? (
    <div
      style={{
        fontSize: '6rem',
        position: 'fixed',
        bottom: 20,
        left: 20,
        zIndex: 10000,
      }}
    >
      <span
        role="img"
        aria-label="debug"
        onClick={() => toggleDevtools(!toggle)}
      >
        👩‍💻
      </span>
    </div>
  ) : (
    <GridLayout
      tabs={<Tabs activeTab={activeTab} onClick={changeTab} />}
      main={<MainContent activeTab={activeTab} view={view} />}
      side={<SideContent />}
      onClose={() => toggleDevtools(!toggle)}
    />
  );
}

function GridLayout({ tabs, main, side, onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        display: 'grid',
        gridTemplateRows: '2.5rem 1fr',
        gridTemplateColumns: '1fr minmax(150px, 33%)',
        gridRowGap: '2px',
        gridColumnGap: '2px',
        border: '2px darkslategrey solid',
        backgroundColor: 'darkslategrey',
        maxHeight: '40vh',
        bottom: 0,
        left: 0,
        width: '100vw',
        zIndex: 10000,
        resize: 'vertical',
      }}
    >
      <div
        style={{
          gridRow: '1 / 2',
          gridColumn: '1/3',
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingRight: '3rem',
          paddingLeft: '3rem',
        }}
      >
        <div>{tabs}</div>
        <div
          className="pm-devtools-hover"
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <span onClick={onClose}>Close</span>
        </div>
      </div>
      <div
        style={{
          backgroundColor: 'yellow',
          gridRow: '2 / 3',
          gridColumn: '1/2',
        }}
      >
        {main}
      </div>

      <div
        style={{
          backgroundColor: 'green',
          gridRow: '2 / 3',
          gridColumn: '2 / 3',
          overflowY: 'scroll',
        }}
      >
        {side}
      </div>
    </div>
  );
}

function Tabs({ activeTab, onClick }) {
  const tabs = [
    'state',
    'history',
    'plugins',
    'schema',
    'structure',
    'snapshots',
  ];
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flex: '1 1 auto',
        flexDirection: 'row',
        alignItems: 'stretch',
      }}
    >
      {tabs.map((t, k) => (
        <Tab
          key={t}
          name={t}
          active={t === activeTab}
          onClick={() => onClick(t)}
        />
      ))}
    </div>
  );
}

function Tab({ name, active, onClick }) {
  const isHovered = false;
  return (
    <span
      onClick={onClick}
      style={{
        cursor: 'pointer',
        display: 'inline-flex',
        minWidth: '7rem',
        backgroundColor: active ? 'pink' : 'unset',
        borderBottom: isHovered ? '2px solid grey' : null,
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      <span style={{ alignSelf: 'center' }}>{name}</span>
    </span>
  );
}

function MainContent({ activeTab, view }) {
  let children;
  activeTab = (activeTab && activeTab).toLocaleLowerCase();
  if (activeTab === 'plugins') {
    children = <Plugins view={view}></Plugins>;
  }
  return (
    <div style={{ padding: '5px 10px', height: '100%' }}>
      {children || JSON.stringify({}, null, 2)}
    </div>
  );
}

function SideContent() {
  return (
    <>
      {Array.from({ length: 1000 }, (_, k) => (
        <span key={k}>Side row</span>
      ))}
    </>
  );
}

function Plugins({ view }) {
  useEffect(() => {
    const someProp = view.someProp.bind(view);
    const originalPlugs = view.state.config.plugins;

    let map = new Map();

    view.state.config.plugins = originalPlugs.map((r) =>
      watchObject(r, {
        name: r.key,
        prop: 'handleKeyDown',
        trap: ({ result, args, time }) => {
          const [, event] = args;
          if (map.has(event)) {
            map.get(event).push({
              name: r.key,
              result,
              time,
            });
          } else {
            map.set(event, [
              {
                name: r.key,
                result,
                time,
              },
            ]);
          }
        },
      }),
    );

    window.map = map;

    return function cleanup() {
      view.someProp = someProp;
      view.state.config.plugins = originalPlugs;
      map = null;
    };
  });

  return <span>hi</span>;
}

function isPlainObj(value) {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}

function watchObject(obj, opts) {
  return new Proxy(obj, {
    get(target, propKey, receiver) {
      const targetValue = Reflect.get(target, propKey, receiver);
      if (typeof targetValue !== 'function') {
        return isPlainObj(targetValue)
          ? watchObject(targetValue, opts)
          : targetValue;
      }

      if (propKey === opts.prop) {
        return function (...args) {
          const t0 = performance.now();
          const result = Reflect.apply(targetValue, target, args);
          const t1 = performance.now();
          opts.trap({
            result,
            args,
            time: t1 - t0,
          });
          return result;
        };
      }
      return targetValue;
    },
  });
}
