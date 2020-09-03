import React, { useRef, useState, useEffect } from 'react';
import { PrettyObj } from './PrettyObj';

export function ProseMirrorDevtools({ editorView }) {
  return <Main />;
}

function Main() {
  const [toggle, toggleDevtools] = useState(false);
  const [currentTab, changeTab] = useState('state');

  return (
    <GridLayout
      tabs={<Tabs currentTab={currentTab} onClick={changeTab} />}
      main={<MainContent />}
      side={<SideContent />}
    />
  );
}

function GridLayout({ tabs, main, side }) {
  return (
    <div
      style={{
        'display': 'grid',
        'grid-template-rows': '2.5rem 1fr',
        'grid-template-columns': '1fr minmax(150px, 33%)',
        'grid-row-gap': '2px',
        'grid-column-gap': '2px',
        'border': '2px darkslategrey solid',
        'position': 'absolute',
        'backgroundColor': 'darkslategrey',
        'max-height': '40vh',
        'bottom': 0,
        'width': '100vw',
        'zIndex': 10000,
        'resize': 'vertical',
      }}
    >
      <div
        style={{
          'grid-row': '1 / 2',
          'grid-column': '1/3',
          'backgroundColor': 'white',
        }}
      >
        {tabs}
      </div>
      <div
        style={{
          'backgroundColor': 'yellow',
          'grid-row': '2 / 3',
          'grid-column': '1/2',
        }}
      >
        {main}
      </div>

      <div
        style={{
          'backgroundColor': 'green',
          'grid-row': '2 / 3',
          'grid-column': '2 / 3',
          'overflowY': 'scroll',
        }}
      >
        {side}
      </div>
    </div>
  );
}

function Tabs({ currentTab, onClick }) {
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
          active={t === currentTab}
          onClick={() => onClick(t)}
        />
      ))}
    </div>
  );
}

function Tab({ name, active, onClick }) {
  const [hoverRef, isHovered] = useHover();
  return (
    <span
      ref={hoverRef}
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

function MainContent({ state = {} }) {
  return (
    <div style={{ padding: '5px 10px', height: '100%' }}>
      {JSON.stringify(state, null, 2)}
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

function useHover() {
  const [value, setValue] = useState(false);

  const ref = useRef(null);

  const handleMouseOver = () => setValue(true);
  const handleMouseOut = () => setValue(false);

  useEffect(
    () => {
      const node = ref.current;
      if (node) {
        node.addEventListener('mouseover', handleMouseOver);
        node.addEventListener('mouseout', handleMouseOut);

        return () => {
          node.removeEventListener('mouseover', handleMouseOver);
          node.removeEventListener('mouseout', handleMouseOut);
        };
      }
    },
    [ref.current], // Recall only if ref changes
  );

  return [ref, value];
}
