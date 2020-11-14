/** @jsx pjsx */
/**
 * @jest-environment jsdom
 */

import { render, fireEvent } from '@testing-library/react';
import { BangleEditor, corePlugins, coreSpec } from 'bangle-core/index';
import { SpecSheet } from 'bangle-core/spec-sheet';
import { ReactEditor } from 'bangle-react/react-editor';
import { getRenderHandlers, NodeView } from 'bangle-core/node-view';
import { safeInsert, removeSelectedNode } from 'bangle-core/utils/pm-utils';
import { bananaComponent, Banana } from './setup/banana';
import { pjsx } from 'bangle-react/__test-helpers__';
import { sleep } from 'bangle-core/utils/js-utils';
import { selectNodeAt } from 'bangle-core/test-helpers/index';
import { Node } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
const consoleError = console.error;

beforeEach(() => {
  console.error = consoleError;
});

const insertBananaAtSelection = (attrs = {}) => (dispatch, state) => {
  const node = state.schema.nodes.banana.create(attrs);
  const newTr = safeInsert(node, state.selection.from)(state.tr);
  if (dispatch) {
    dispatch(newTr);
  }
  return true;
};

describe('basic tests', () => {
  let specSheet, plugins;
  beforeEach(() => {
    specSheet = new SpecSheet([...coreSpec()]);
    plugins = [...corePlugins()];
  });

  test('mounts correctly', async () => {
    const onReady = jest.fn();
    const result = await render(
      <ReactEditor
        options={{
          id: 'test',
          specSheet,
          plugins,
        }}
        onReady={onReady}
      />,
    );

    expect(onReady).toBeCalledTimes(1);
    expect(onReady).toHaveBeenNthCalledWith(1, expect.any(BangleEditor));
    expect(result.container).toMatchInlineSnapshot(`
      <div>
        <div
          id="test"
        >
          <div
            class="ProseMirror bangle-editor"
            contenteditable="true"
          >
            <p>
              <br />
            </p>
          </div>
        </div>
      </div>
    `);
  });

  test('Unmounting destroys editor', async () => {
    let editor;
    const onReady = (_editor) => {
      editor = _editor;
    };
    const result = await render(
      <ReactEditor
        options={{
          id: 'test',
          specSheet,
          plugins,
        }}
        onReady={onReady}
      />,
    );
    expect(editor.view.docView).toBeTruthy();
    await result.unmount();
    expect(editor.view.docView).toBeNull();
  });
});

describe('rendering node views', () => {
  test('persists node view render handlers', async () => {
    let editor;
    const onReady = (_editor) => {
      editor = _editor;
    };
    await render(
      <ReactEditor
        options={{
          id: 'test',
          specSheet: new SpecSheet([...coreSpec()]),
          plugins: [...corePlugins()],
        }}
        onReady={onReady}
      />,
    );

    expect(getRenderHandlers(editor.view)).toEqual({
      create: expect.any(Function),
      update: expect.any(Function),
      destroy: expect.any(Function),
    });
  });

  test('Throws error if rendering is not implemented', async () => {
    console.error = jest.fn();
    let editor;
    const onReady = (_editor) => {
      editor = _editor;
    };

    const banana = bananaComponent('react-editor-test');
    const spec = new SpecSheet([...coreSpec(), banana.spec()]);
    expect(() =>
      render(
        <ReactEditor
          options={{
            id: 'test',
            specSheet: spec,
            plugins: [...corePlugins(), banana.plugins()],
            stateOpts: {
              doc: (<doc>
                <para>
                  hello <banana color="brown" /> world
                </para>
              </doc>)(spec.schema),
            },
          }}
          onReady={onReady}
          renderNodeViews={() => {}}
        />,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"renderNodeView must handle rendering for node of type \\"banana\\""`,
    );
  });

  test('Handles add and delete of node views', async () => {
    console.error = jest.fn();
    let editor;
    const onReady = (_editor) => {
      editor = _editor;
    };

    const renderNodeViews = jest.fn(({ node, ...args }) => {
      if (node.type.name === 'banana') {
        return <Banana node={node} {...args} />;
      }
      throw new Error('Unknown node');
    });

    const banana = bananaComponent('react-editor-test');
    const spec = new SpecSheet([...coreSpec(), banana.spec()]);

    const { container } = await render(
      <ReactEditor
        options={{
          id: 'test',
          specSheet: spec,
          plugins: [...corePlugins(), banana.plugins()],
          stateOpts: {
            doc: (<doc>
              <para>hello world</para>
            </doc>)(spec.schema),
          },
        }}
        onReady={onReady}
        renderNodeViews={renderNodeViews}
      />,
    );
    const view = editor.view;
    insertBananaAtSelection()(view.dispatch, view.state);
    await sleep(10);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>
          <banana />
          hello world
        </para>
      </doc>,
    );

    insertBananaAtSelection({ color: 'pink' })(view.dispatch, view.state);
    insertBananaAtSelection({ color: 'brown' })(view.dispatch, view.state);

    expect(renderNodeViews).toBeCalledTimes(3);

    await sleep(10);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>
          <banana color={'brown'} />
          <banana color={'pink'} />
          <banana color={'yellow'} />
          hello world
        </para>
      </doc>,
    );

    expect(container).toMatchSnapshot();

    // Select pink one
    selectNodeAt(view, 2);
    expect(view.state.selection.node.attrs).toMatchObject({ color: 'pink' });

    view.dispatch(removeSelectedNode(view.state.tr));

    expect(renderNodeViews).toBeCalledTimes(4);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>
          <banana color={'brown'} />
          <banana color={'yellow'} />
          hello world
        </para>
      </doc>,
    );

    expect(container).toMatchSnapshot();
  });

  test('handles updating of attrs', async () => {
    console.error = jest.fn();
    let editor;
    const onReady = (_editor) => {
      editor = _editor;
    };

    const renderNodeViews = jest.fn(({ node, ...args }) => {
      if (node.type.name === 'banana') {
        return <Banana node={node} {...args} />;
      }
      throw new Error('Unknown node');
    });

    const banana = bananaComponent('react-editor-test');
    const spec = new SpecSheet([...coreSpec(), banana.spec()]);

    const { container } = await render(
      <ReactEditor
        options={{
          id: 'test',
          specSheet: spec,
          plugins: [...corePlugins(), banana.plugins()],
          stateOpts: {
            doc: (<doc>
              <para>hello world</para>
            </doc>)(spec.schema),
          },
        }}
        onReady={onReady}
        renderNodeViews={renderNodeViews}
      />,
    );
    const view = editor.view;
    insertBananaAtSelection({ color: 'blue' })(view.dispatch, view.state);
    insertBananaAtSelection({ color: 'red' })(view.dispatch, view.state);
    insertBananaAtSelection({ color: 'orange' })(view.dispatch, view.state);
    await sleep(10);

    const orangeBananaDOM = container.querySelector(`[data-color="orange"]`);
    expect(orangeBananaDOM).toMatchInlineSnapshot(`
      <div
        data-color="orange"
      >
        I am fresh orange banana
      </div>
    `);

    fireEvent.click(orangeBananaDOM);
    await sleep(10);
    expect(orangeBananaDOM).toMatchInlineSnapshot(`
      <div
        data-color="orange"
      >
        I am stale orange banana
      </div>
    `);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>
          <banana ripe="stale" color={'orange'} />
          <banana color={'red'} />
          <banana color={'blue'} />
          hello world
        </para>
      </doc>,
    );
  });

  test('Calls rendering with correct params', async () => {
    console.error = jest.fn();
    let editor;
    const onReady = (_editor) => {
      editor = _editor;
    };

    const renderNodeViews = jest.fn(({ node, ...args }) => {
      if (node.type.name === 'banana') {
        return <Banana node={node} {...args} />;
      }
      throw new Error('Unknown node');
    });

    const banana = bananaComponent('react-editor-test');
    const spec = new SpecSheet([...coreSpec(), banana.spec()]);

    const { container } = await render(
      <ReactEditor
        options={{
          id: 'test',
          specSheet: spec,
          plugins: [...corePlugins(), banana.plugins()],
          stateOpts: {
            doc: (<doc>
              <para>hello world</para>
            </doc>)(spec.schema),
          },
        }}
        onReady={onReady}
        renderNodeViews={renderNodeViews}
      />,
    );
    const view = editor.view;
    insertBananaAtSelection({ color: 'blue' })(view.dispatch, view.state);

    expect(renderNodeViews).toBeCalledTimes(1);
    expect(renderNodeViews).toHaveBeenNthCalledWith(1, {
      node: expect.any(Node),
      view: expect.any(EditorView),
      getPos: expect.any(Function),
      decorations: expect.anything(),
      selected: expect.any(Boolean),
      attrs: {
        color: 'blue',
        ripe: 'fresh',
      },
      updateAttrs: expect.any(Function),
      children: null,
    });

    const orangeBananaDOM = container.querySelector(`[data-color="blue"]`);

    fireEvent.click(orangeBananaDOM);
    await sleep(10);

    expect(renderNodeViews).toBeCalledTimes(2);
    expect(renderNodeViews).toHaveBeenNthCalledWith(2, {
      node: expect.any(Node),
      view: expect.any(EditorView),
      getPos: expect.any(Function),
      decorations: expect.anything(),
      selected: expect.any(Boolean),
      attrs: {
        color: 'blue',
        ripe: 'stale',
      },
      updateAttrs: expect.any(Function),
      children: null,
    });
  });
});
