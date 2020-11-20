/** @jsx pjsx */
/**
 * @jest-environment jsdom
 */

import { render, act } from '@testing-library/react';
import { corePlugins, coreSpec } from 'bangle-core/index';
import { SpecSheet } from 'bangle-core/spec-sheet';
import { ReactEditor } from 'bangle-react/react-editor';
import { pjsx, Span } from './helpers/index';
import { Plugin, PluginKey } from 'bangle-core/index';
import { usePluginState } from 'bangle-react/use-plugin-state';
import { useEffect, useState } from 'react';

const key = new PluginKey('testPlugins');
let specSheet, plugins, view, counterPlugin;

const onReady = ({ _view }) => {
  view = _view;
};

const updateCounter = (counter) =>
  view.dispatch(view.state.tr.setMeta(key, { counter }));

beforeEach(() => {
  view = undefined;
  specSheet = new SpecSheet([...coreSpec()]);

  counterPlugin = new Plugin({
    key,
    state: {
      init() {
        return { counter: 0 };
      },
      apply(tr, v) {
        if (tr.getMeta(key)) {
          return tr.getMeta(key);
        }
        return v;
      },
    },
  });
  plugins = [...corePlugins(), counterPlugin];
});

function TestComponent({ pluginKey, renderCounter }) {
  const menuState = usePluginState(pluginKey);
  renderCounter();
  return <Span data-testid="test-component">{menuState.counter}</Span>;
}

test('correctly gets view', async () => {
  let renderedTimes = 0;

  const result = await render(
    <ReactEditor
      options={{
        id: 'test',
        specSheet,
        plugins,
      }}
      onReady={onReady}
    >
      <TestComponent pluginKey={key} renderCounter={() => renderedTimes++} />
    </ReactEditor>,
  );

  expect(renderedTimes).toBe(1);

  act(() => updateCounter(1));
  expect(key.getState(view.state)).toEqual({ counter: 1 });
  expect(renderedTimes).toBe(2);

  expect(await result.findByTestId('test-component')).toMatchInlineSnapshot(`
    <span
      data-testid="test-component"
    >
      1
    </span>
  `);

  act(() => updateCounter(2));
  expect(renderedTimes).toBe(3);

  expect(await result.findByTestId('test-component')).toMatchInlineSnapshot(`
    <span
      data-testid="test-component"
    >
      2
    </span>
  `);
});

test('Mounting and Unmounting of editor', async () => {
  let renderedTimes = 0;
  let mountTimes = 0;
  let unmountTimes = 0;
  const TestComponent = ({ pluginKey, renderCounter }) => {
    const menuState = usePluginState(pluginKey);
    useEffect(() => {
      mountTimes++;
      return () => {
        unmountTimes++;
      };
    }, []);
    renderCounter();
    return <Span data-testid="test-component">{menuState.counter}</Span>;
  };

  const result = await render(
    <ReactEditor
      options={{
        id: 'test',
        specSheet,
        plugins,
      }}
      onReady={onReady}
    >
      <TestComponent pluginKey={key} renderCounter={() => renderedTimes++} />
    </ReactEditor>,
  );
  expect(mountTimes).toBe(1);

  expect(view.state.plugins).toContain(counterPlugin);
  expect(
    view.state.plugins.filter((p) => p.key.startsWith('withPluginState_')),
  ).toHaveLength(1);

  act(() => updateCounter(1));
  expect([mountTimes, unmountTimes]).toEqual([1, 0]);
  expect(renderedTimes).toBe(2);

  await result.unmount();

  expect([mountTimes, unmountTimes]).toEqual([1, 1]);
  expect(renderedTimes).toBe(2);
});

test('Unmounting just the component', async () => {
  let renderedTimes = 0;
  let mountTimes = 0;
  let unmountTimes = 0;
  let toggleParent;
  const ParentComponent = ({ children }) => {
    const [show, toggleShow] = useState(true);
    toggleParent = toggleShow;
    if (show) {
      return children;
    }
    return null;
  };
  const TestComponent = ({ pluginKey, renderCounter }) => {
    const menuState = usePluginState(pluginKey);
    useEffect(() => {
      mountTimes++;
      return () => {
        unmountTimes++;
      };
    }, []);
    renderCounter();
    return <Span data-testid="test-component">{menuState.counter}</Span>;
  };

  const result = await render(
    <ReactEditor
      options={{
        id: 'test',
        specSheet,
        plugins,
      }}
      onReady={onReady}
    >
      <ParentComponent>
        <TestComponent pluginKey={key} renderCounter={() => renderedTimes++} />
      </ParentComponent>
    </ReactEditor>,
  );

  const pluginsLength = view.state.plugins.length;
  expect(
    view.state.plugins.filter((p) => p.key.startsWith('withPluginState_')),
  ).toHaveLength(1);

  act(() => updateCounter(1));
  act(() => updateCounter(2));
  expect([mountTimes, unmountTimes]).toEqual([1, 0]);
  act(() => toggleParent(false));

  expect(
    view.state.plugins.filter((p) => p.key.startsWith('withPluginState_')),
  ).toHaveLength(0);
  expect([mountTimes, unmountTimes]).toEqual([1, 1]);
  expect(view.state.plugins).toHaveLength(pluginsLength - 1);

  // update the counter when there is no watcher
  act(() => updateCounter(3));

  act(() => toggleParent(true));
  expect(
    view.state.plugins.filter((p) => p.key.startsWith('withPluginState_')),
  ).toHaveLength(1);
  expect([mountTimes, unmountTimes]).toEqual([2, 1]);

  expect(await result.findByTestId('test-component')).toMatchInlineSnapshot(`
    <span
      data-testid="test-component"
    >
      3
    </span>
  `);

  act(() => updateCounter(4));

  expect(await result.findByTestId('test-component')).toMatchInlineSnapshot(`
  <span
    data-testid="test-component"
  >
    4
  </span>
`);
});
